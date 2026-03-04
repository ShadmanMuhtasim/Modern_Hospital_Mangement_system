const router = require("express").Router();
const requireAuth = require("../middleware/requireAuth");
const { getPool, sql } = require("../config/db");

// helper: logged-in patient exists?
async function ensurePatient(pool, userId) {
  const r = await pool.request().input("uid", sql.Int, userId)
    .query(`SELECT patient_id FROM dbo.Patients WHERE patient_id=@uid`);
  return r.recordset[0] || null;
}

// 1) Admit patient + assign an AVAILABLE bed (optional unitType + departmentName)
router.post("/admit", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const patient = await ensurePatient(pool, req.user.userId);
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const { diagnosis, unitType, departmentName } = req.body || {};

    // default department
    const dep = await pool.request()
      .input("dn", sql.NVarChar, departmentName || "General Medicine")
      .query(`SELECT TOP 1 department_id FROM dbo.Departments WHERE dept_name=@dn`);
    const deptId = dep.recordset?.[0]?.department_id;
    if (!deptId) return res.status(404).json({ message: "Department not found" });

    const careLevel = unitType ? String(unitType).toUpperCase() : "General";
    const mapped =
      careLevel === "ICU" ? "ICU" :
      careLevel === "NICU" ? "NICU" :
      careLevel === "CCU" ? "CCU" : "General";

    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      // create admission
      const a = await new sql.Request(tx)
        .input("pid", sql.Int, req.user.userId)
        .input("dept", sql.Int, deptId)
        .input("diag", sql.NVarChar, diagnosis || null)
        .input("care", sql.NVarChar, mapped)
        .query(`
          INSERT INTO dbo.Admissions(patient_id,department_id,status,care_level_requested,diagnosis_initial)
          OUTPUT INSERTED.admission_id
          VALUES (@pid,@dept,'Admitted',@care,@diag)
        `);
      const admissionId = a.recordset[0].admission_id;

      // find available bed in that dept + unit type
      const bed = await new sql.Request(tx)
        .input("dept", sql.Int, deptId)
        .input("ut", sql.NVarChar, mapped === "General" ? "Ward" : mapped)
        .query(`
          SELECT TOP 1 b.bed_id
          FROM dbo.Beds b
          JOIN dbo.CareUnits cu ON cu.care_unit_id=b.care_unit_id
          WHERE cu.department_id=@dept
            AND cu.unit_type=@ut
            AND b.status='Available'
          ORDER BY b.bed_id
        `);

      const bedId = bed.recordset?.[0]?.bed_id || null;

      if (bedId) {
        await new sql.Request(tx)
          .input("adm", sql.Int, admissionId)
          .input("bed", sql.Int, bedId)
          .input("by", sql.Int, req.user.userId)
          .query(`
            INSERT INTO dbo.BedAssignments(admission_id,bed_id,assigned_by_user_id)
            VALUES (@adm,@bed,@by)
          `);

        await new sql.Request(tx)
          .input("bed", sql.Int, bedId)
          .query(`UPDATE dbo.Beds SET status='Occupied' WHERE bed_id=@bed`);
      }

      await tx.commit();

      res.status(201).json({
        message: "Admitted",
        admissionId,
        bedAssigned: !!bedId,
        bedId
      });
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 2) My admissions (patient)
router.get("/my", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().input("pid", sql.Int, req.user.userId).query(`
      SELECT a.*,
             d.dept_name,
             b.bed_code,
             cu.unit_type
      FROM dbo.Admissions a
      JOIN dbo.Departments d ON d.department_id=a.department_id
      LEFT JOIN dbo.BedAssignments ba ON ba.admission_id=a.admission_id AND ba.released_at IS NULL
      LEFT JOIN dbo.Beds b ON b.bed_id=ba.bed_id
      LEFT JOIN dbo.CareUnits cu ON cu.care_unit_id=b.care_unit_id
      WHERE a.patient_id=@pid
      ORDER BY a.admission_id DESC
    `);
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
/*
const router = require("express").Router();
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");

// helper: logged-in patient
async function getPatient(req) {
  return prisma.patient.findUnique({
    where: { userId: req.user.userId },
    select: { id: true, fullName: true },
  });
}

// 1) Admit patient + assign an AVAILABLE bed (optional unit filter)
router.post("/admit", requireAuth, async (req, res) => {
  try {
    const patient = await getPatient(req);
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const { diagnosis, unitType } = req.body;

    // find an available bed (optionally within a unitType like ICU/CCU/NCU/GENERAL)
    let bedWhere = { status: "AVAILABLE" };

    if (unitType) {
      const unit = await prisma.wardUnit.findFirst({
        where: { unitType: String(unitType).toUpperCase() },
        select: { id: true, unitType: true },
      });
      if (!unit) return res.status(404).json({ message: "Ward unitType not found" });

      bedWhere.unitId = unit.id;
    }

    const bed = await prisma.bed.findFirst({
      where: bedWhere,
      orderBy: { id: "asc" },
    });

    if (!bed) return res.status(400).json({ message: "No AVAILABLE bed found" });

    // transaction: create admission + mark bed occupied
    const [admission, updatedBed] = await prisma.$transaction([
  prisma.admission.create({
    data: {
      patientId: patient.id,
      diagnosis: diagnosis || null,
      status: "Admitted",
      bedId: bed.id,
    },
  }),
  prisma.bed.update({
    where: { id: bed.id },
    data: { status: "OCCUPIED" },
  }),
]);

res.status(201).json({
  message: "Admitted and bed assigned",
  admission,
  bed: updatedBed,
});
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 2) Discharge admission + release bed
router.patch("/:admissionId/discharge", requireAuth, async (req, res) => {
  try {
    const admissionId = Number(req.params.admissionId);

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
    });
    if (!admission) return res.status(404).json({ message: "Admission not found" });

    // Only allow discharge if bed exists
    const bedId = admission.bedId;

    const tx = [
      prisma.admission.update({
        where: { id: admissionId },
        data: {
          status: "Discharged",
          dischargeDate: new Date(),
        },
      }),
    ];

    if (bedId) {
      tx.push(
        prisma.bed.update({
          where: { id: bedId },
          data: { status: "AVAILABLE" },
        })
      );
    }

    const result = await prisma.$transaction(tx);

    res.json({
      message: "Discharged and bed released",
      admission: result[0],
      bedReleased: bedId ? bedId : null,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 3) View my admissions
router.get("/my", requireAuth, async (req, res) => {
  try {
    const patient = await getPatient(req);
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const list = await prisma.admission.findMany({
      where: { patientId: patient.id },
      orderBy: { admitDate: "desc" },
      include: { bed: true },
    });

    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

*/
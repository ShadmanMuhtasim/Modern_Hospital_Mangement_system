const router = require("express").Router();
const requireAuth = require("../middleware/requireAuth");
const { getPool, sql } = require("../config/db");

// 1) Create a medical record for logged-in patient
router.post("/records", requireAuth, async (req, res) => {
  try {
    const { diagnosis, treatment, notes } = req.body || {};
    if (!diagnosis || !treatment) return res.status(400).json({ message: "diagnosis and treatment are required" });

    const pool = await getPool();

    // ensure patient
    const p = await pool.request().input("uid", sql.Int, req.user.userId)
      .query(`SELECT patient_id FROM dbo.Patients WHERE patient_id=@uid`);
    if (!p.recordset.length) return res.status(404).json({ message: "Patient profile not found" });

    const r = await pool.request()
      .input("pid", sql.Int, req.user.userId)
      .input("by", sql.Int, req.user.userId)
      .input("diag", sql.NVarChar, diagnosis)
      .input("tp", sql.NVarChar, treatment)
      .input("notes", sql.NVarChar, notes || null)
      .query(`
        INSERT INTO dbo.MedicalRecords(patient_id,created_by_user_id,diagnosis,treatment_plan,notes)
        OUTPUT INSERTED.record_id
        VALUES (@pid,@by,@diag,@tp,@notes)
      `);

    res.status(201).json({ recordId: r.recordset[0].record_id });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 2) My records
router.get("/records/my", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().input("pid", sql.Int, req.user.userId).query(`
      SELECT *
      FROM dbo.MedicalRecords
      WHERE patient_id=@pid
      ORDER BY record_datetime DESC
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

// helper: current patient from JWT
async function getPatient(req) {
  return prisma.patient.findUnique({
    where: { userId: req.user.userId },
    select: { id: true, fullName: true },
  });
}

// 1) Create a medical record for logged-in patient
router.post("/records", requireAuth, async (req, res) => {
  try {
    const patient = await getPatient(req);
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const { recordNo, diagnosis, treatment, notes, recordDate } = req.body;
    if (!recordNo) return res.status(400).json({ message: "recordNo is required" });

    const created = await prisma.medicalRecord.create({
      data: {
        recordNo,
        diagnosis: diagnosis || null,
        treatment: treatment || null,
        notes: notes || null,
        recordDate: recordDate ? new Date(recordDate) : undefined,
        patientId: patient.id,
      },
    });

    res.status(201).json(created);
  } catch (e) {
    // recordNo unique will throw here
    res.status(500).json({ message: e.message });
  }
});

// 2) List my medical records (filters supported)
router.get("/records/my", requireAuth, async (req, res) => {
  try {
    const patient = await getPatient(req);
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const { from, to, q } = req.query;
    const where = { patientId: patient.id };

    // date range filter
    if (from || to) {
      where.recordDate = {};
      if (from) where.recordDate.gte = new Date(from);
      if (to) where.recordDate.lte = new Date(to);
    }

    // keyword filter across diagnosis/treatment/notes
        if (q) {
      const keyword = String(q);
      where.OR = [
        { diagnosis: { contains: keyword } },
        { treatment: { contains: keyword } },
        { notes: { contains: keyword } },
        { recordNo: { contains: keyword } },
      ];
    }

    const list = await prisma.medicalRecord.findMany({
      where,
      orderBy: { recordDate: "desc" },
    });

    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
*/
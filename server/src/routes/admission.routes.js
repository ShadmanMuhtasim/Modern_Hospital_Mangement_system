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
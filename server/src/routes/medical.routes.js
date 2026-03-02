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
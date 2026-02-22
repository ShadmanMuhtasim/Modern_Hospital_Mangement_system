const router = require("express").Router();
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");

// helper: find patient by JWT userId
async function getPatientByUserId(userId) {
  return prisma.patient.findUnique({
    where: { userId },
    select: { id: true, bloodGroup: true, fullName: true },
  });
}

// ✅ Global inventory (visible to patients)
router.get("/inventory", requireAuth, async (req, res) => {
  try {
    const list = await prisma.bloodInventory.findMany({ orderBy: { bloodGroup: "asc" } });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ✅ Request blood: PENDING
router.post("/request", requireAuth, async (req, res) => {
  try {
    const { bloodGroup, unitsRequested } = req.body;

    if (!bloodGroup || !unitsRequested) {
      return res.status(400).json({ message: "bloodGroup and unitsRequested are required" });
    }
    if (Number(unitsRequested) <= 0) {
      return res.status(400).json({ message: "unitsRequested must be > 0" });
    }

    const patient = await getPatientByUserId(req.user.userId);
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const created = await prisma.bloodRequest.create({
      data: {
        patientId: patient.id,
        bloodGroup,
        unitsRequested: Number(unitsRequested),
        status: "PENDING",
      },
    });

    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ✅ Donate blood: auto-approved and MUST match patient bloodGroup
router.post("/donate", requireAuth, async (req, res) => {
  try {
    const { unitsDonated } = req.body;

    if (!unitsDonated) return res.status(400).json({ message: "unitsDonated is required" });
    if (Number(unitsDonated) <= 0) return res.status(400).json({ message: "unitsDonated must be > 0" });

    const patient = await getPatientByUserId(req.user.userId);
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });
    if (!patient.bloodGroup) return res.status(400).json({ message: "Patient bloodGroup is not set" });

    const donation = await prisma.bloodDonation.create({
      data: {
        patientId: patient.id,
        bloodGroup: patient.bloodGroup,
        unitsDonated: Number(unitsDonated),
        status: "APPROVED",
      },
    });

    // increment inventory
    await prisma.bloodInventory.upsert({
      where: { bloodGroup: patient.bloodGroup },
      update: { unitsAvailable: { increment: Number(unitsDonated) } },
      create: { bloodGroup: patient.bloodGroup, unitsAvailable: Number(unitsDonated) },
    });

    res.status(201).json({ donation, message: `Added ${unitsDonated} units to ${patient.bloodGroup}` });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ✅ My blood requests
router.get("/requests/my", requireAuth, async (req, res) => {
  try {
    const patient = await getPatientByUserId(req.user.userId);
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const list = await prisma.bloodRequest.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ✅ My donations
router.get("/donations/my", requireAuth, async (req, res) => {
  try {
    const patient = await getPatientByUserId(req.user.userId);
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const list = await prisma.bloodDonation.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
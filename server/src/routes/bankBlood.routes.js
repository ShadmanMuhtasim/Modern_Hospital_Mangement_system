const router = require("express").Router();
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");
const { getCompatibleDonorGroups, normalizeGroup } = require("../utils/bloodCompatibility");

// 1) List blood banks
router.get("/banks", requireAuth, async (req, res) => {
  try {
    const banks = await prisma.bloodBank.findMany({ orderBy: { id: "asc" } });
    res.json(banks);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 2) Bank inventory
router.get("/banks/:bankId/inventory", requireAuth, async (req, res) => {
  try {
    const bankId = Number(req.params.bankId);
    const list = await prisma.bankBloodInventory.findMany({
      where: { bankId },
      orderBy: { bloodGroup: "asc" },
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 3) Register non-patient donor
router.post("/donors/register", requireAuth, async (req, res) => {
  try {
    const { fullName, phone, dob, bloodGroup } = req.body;
    if (!fullName || !bloodGroup) {
      return res.status(400).json({ message: "fullName and bloodGroup are required" });
    }

    const donor = await prisma.bloodDonor.create({
      data: {
        fullName,
        phone: phone || null,
        dob: dob ? new Date(dob) : null,
        bloodGroup: normalizeGroup(bloodGroup),
      },
    });

    res.status(201).json(donor);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 4) Donate to bank (increments bank inventory)
router.post("/banks/:bankId/donate", requireAuth, async (req, res) => {
  try {
    const bankId = Number(req.params.bankId);
    const { donorId, unitsDonated } = req.body;

    if (!donorId || !unitsDonated) {
      return res.status(400).json({ message: "donorId and unitsDonated are required" });
    }
    if (Number(unitsDonated) <= 0) {
      return res.status(400).json({ message: "unitsDonated must be > 0" });
    }

    const donor = await prisma.bloodDonor.findUnique({ where: { id: Number(donorId) } });
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    const donation = await prisma.bankDonation.create({
      data: {
        bankId,
        donorId: donor.id,
        bloodGroup: donor.bloodGroup,
        unitsDonated: Number(unitsDonated),
        status: "APPROVED",
      },
    });

    await prisma.bankBloodInventory.upsert({
      where: { bankId_bloodGroup: { bankId, bloodGroup: donor.bloodGroup } },
      update: { unitsAvailable: { increment: Number(unitsDonated) } },
      create: { bankId, bloodGroup: donor.bloodGroup, unitsAvailable: Number(unitsDonated) },
    });

    await prisma.bloodDonor.update({
      where: { id: donor.id },
      data: { lastDonationDate: new Date() },
    });

    res.status(201).json({ donation, message: `Added ${unitsDonated} units to ${donor.bloodGroup} at bank ${bankId}` });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 5) Patient requests blood from a bank
router.post("/banks/:bankId/request", requireAuth, async (req, res) => {
  try {
    const bankId = Number(req.params.bankId);
    const { bloodGroup, unitsRequested } = req.body;

    if (!bloodGroup || !unitsRequested) {
      return res.status(400).json({ message: "bloodGroup and unitsRequested are required" });
    }
    if (Number(unitsRequested) <= 0) {
      return res.status(400).json({ message: "unitsRequested must be > 0" });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.userId },
      select: { id: true },
    });
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const created = await prisma.bankBloodRequest.create({
      data: {
        bankId,
        patientId: patient.id,
        bloodGroup: normalizeGroup(bloodGroup),
        unitsRequested: Number(unitsRequested),
        status: "PENDING",
      },
    });

    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 6) Issue/Fulfill request with compatibility + inventory decrement
router.post("/requests/:requestId/issue", requireAuth, async (req, res) => {
  try {
    const requestId = Number(req.params.requestId);
    const { unitsToIssue } = req.body;

    if (!unitsToIssue || Number(unitsToIssue) <= 0) {
      return res.status(400).json({ message: "unitsToIssue must be > 0" });
    }

    const request = await prisma.bankBloodRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.status === "FULFILLED") {
      return res.status(400).json({ message: "Request already fulfilled" });
    }

    const needed = Math.min(Number(unitsToIssue), request.unitsRequested);
    const compatibleGroups = getCompatibleDonorGroups(request.bloodGroup);

    if (compatibleGroups.length === 0) {
      return res.status(400).json({ message: "Invalid recipient bloodGroup" });
    }

    const inventories = await prisma.bankBloodInventory.findMany({
      where: { bankId: request.bankId, bloodGroup: { in: compatibleGroups } },
      orderBy: { unitsAvailable: "desc" },
    });

    let remaining = needed;
    const used = [];

    for (const inv of inventories) {
      if (remaining <= 0) break;
      if (inv.unitsAvailable <= 0) continue;

      const take = Math.min(inv.unitsAvailable, remaining);

      await prisma.bankBloodInventory.update({
        where: { id: inv.id },
        data: { unitsAvailable: { decrement: take } },
      });

      used.push({ bloodGroup: inv.bloodGroup, units: take });
      remaining -= take;
    }

    const issuedTotal = used.reduce((sum, x) => sum + x.units, 0);
    if (issuedTotal === 0) {
      return res.status(400).json({ message: "No compatible blood available in this bank" });
    }

    await prisma.$transaction(
      used.map((u) =>
        prisma.bloodIssue.create({
          data: {
            bankId: request.bankId,
            requestId: request.id,
            unitsIssued: u.units,
            issuedGroup: u.bloodGroup,
            status: "ISSUED",
          },
        })
      )
    );

    const newStatus = issuedTotal >= request.unitsRequested ? "FULFILLED" : "APPROVED";
    const updatedRequest = await prisma.bankBloodRequest.update({
      where: { id: request.id },
      data: { status: newStatus },
    });

    res.json({
      message: "Issued blood successfully",
      issuedTotal,
      used,
      request: updatedRequest,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
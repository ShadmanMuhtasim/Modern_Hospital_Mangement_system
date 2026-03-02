const router = require("express").Router();
const bcrypt = require("bcrypt");
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");

// APPLY (creates APPLICANT user + StaffApplication)
router.post("/apply", async (req, res) => {
  try {
    const { fullName, email, password, roleAppliedFor } = req.body || {};
    if (!fullName || !email || !password || !roleAppliedFor) {
      return res.status(400).json({ message: "fullName, email, password, roleAppliedFor are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash, role: "APPLICANT" },
    });

    const app = await prisma.staffApplication.create({
      data: {
        fullName,
        email,
        roleAppliedFor: String(roleAppliedFor).toUpperCase(),
        status: "PENDING",
        applicantUserId: user.id,
      },
    });

    res.status(201).json({
      message: "Application submitted",
      user: { id: user.id, email: user.email, role: user.role },
      application: app,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// APPLICANT: view my applications
router.get("/my", requireAuth, async (req, res) => {
  try {
    const list = await prisma.staffApplication.findMany({
      where: { applicantUserId: req.user.userId },
      orderBy: { appliedAt: "desc" },
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ADMIN: list applications (filters)
router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, role } = req.query;
    const where = {};
    if (status) where.status = String(status).toUpperCase();
    if (role) where.roleAppliedFor = String(role).toUpperCase();

    const list = await prisma.staffApplication.findMany({
      where,
      orderBy: { appliedAt: "desc" },
    });

    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ADMIN: approve (upgrade user role + create profile)
router.patch("/:id/approve", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const app = await prisma.staffApplication.findUnique({ where: { id } });
    if (!app) return res.status(404).json({ message: "Application not found" });
    if (!app.applicantUserId) return res.status(400).json({ message: "No linked applicant user" });

    const newRole = String(app.roleAppliedFor).toUpperCase();
    const userId = app.applicantUserId;

    // Doctor requires departmentId, so we assign first department by default
    const dept = newRole === "DOCTOR" ? await prisma.department.findFirst() : null;
    if (newRole === "DOCTOR" && !dept) {
      return res.status(400).json({ message: "No department found. Seed departments first." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { role: newRole },
      });

      if (newRole === "NURSE") {
        await tx.nurse.create({ data: { fullName: app.fullName, userId } });
      } else if (newRole === "IT") {
        await tx.iTWorker.create({ data: { fullName: app.fullName, userId } });
      } else if (newRole === "DOCTOR") {
        await tx.doctor.create({ data: { fullName: app.fullName, departmentId: dept.id, userId } });
      }

      const updatedApp = await tx.staffApplication.update({
        where: { id },
        data: { status: "APPROVED", reviewedByAdminUserId: req.user.userId },
      });

      return { updatedUser, updatedApp };
    });

    res.json({ message: "Approved", ...result });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ADMIN: reject
router.patch("/:id/reject", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const updated = await prisma.staffApplication.update({
      where: { id },
      data: { status: "REJECTED", reviewedByAdminUserId: req.user.userId },
    });

    res.json({ message: "Rejected", application: updated });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
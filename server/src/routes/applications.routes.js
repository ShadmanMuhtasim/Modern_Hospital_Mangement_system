const router = require("express").Router();
const bcrypt = require("bcrypt");
const requireAuth = require("../middleware/requireAuth");
const { getPool, sql } = require("../config/db");

// APPLY (creates Applicant user + JobApplications row)
router.post("/apply", async (req, res) => {
  try {
    const { fullName, email, password, roleAppliedFor, departmentName } = req.body || {};
    if (!fullName || !email || !password || !roleAppliedFor) {
      return res.status(400).json({ message: "fullName, email, password, roleAppliedFor are required" });
    }

    const pool = await getPool();

    const existing = await pool.request().input("email", sql.NVarChar, email)
      .query(`SELECT user_id FROM dbo.Users WHERE email=@email`);
    if (existing.recordset.length) return res.status(409).json({ message: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);

    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const u = await new sql.Request(tx)
        .input("email", sql.NVarChar, email)
        .input("password_hash", sql.NVarChar, passwordHash)
        .input("full_name", sql.NVarChar, fullName)
        .query(`
          INSERT INTO dbo.Users(email,password_hash,full_name,account_status)
          OUTPUT INSERTED.user_id
          VALUES (@email,@password_hash,@full_name,'Active')
        `);

      const userId = u.recordset[0].user_id;

      // Applicant role
      const applicantRole = await new sql.Request(tx)
        .input("r", sql.NVarChar, "Applicant")
        .query(`SELECT role_id FROM dbo.Roles WHERE role_name=@r`);
      const applicantRoleId = applicantRole.recordset?.[0]?.role_id;
      if (!applicantRoleId) throw new Error("Applicant role missing. Run seed_data.sql");

      await new sql.Request(tx)
        .input("uid", sql.Int, userId)
        .input("rid", sql.Int, applicantRoleId)
        .query(`INSERT INTO dbo.UserRoles(user_id,role_id) VALUES (@uid,@rid)`);

      // Applied role
      const appliedRole = await new sql.Request(tx)
        .input("r", sql.NVarChar, String(roleAppliedFor))
        .query(`SELECT role_id FROM dbo.Roles WHERE role_name=@r`);
      const appliedRoleId = appliedRole.recordset?.[0]?.role_id;
      if (!appliedRoleId) throw new Error("Applied role not found in Roles table.");

      // Department (optional)
      let deptId = null;
      if (departmentName) {
        const dep = await new sql.Request(tx)
          .input("d", sql.NVarChar, String(departmentName))
          .query(`SELECT department_id FROM dbo.Departments WHERE dept_name=@d`);
        deptId = dep.recordset?.[0]?.department_id || null;
      }

      const app = await new sql.Request(tx)
        .input("user_id", sql.Int, userId)
        .input("applied_role_id", sql.Int, appliedRoleId)
        .input("applied_department_id", sql.Int, deptId)
        .query(`
          INSERT INTO dbo.JobApplications(user_id, applied_role_id, applied_department_id, status)
          OUTPUT INSERTED.application_id
          VALUES (@user_id,@applied_role_id,@applied_department_id,'Pending')
        `);

      await tx.commit();

      res.status(201).json({
        message: "Application submitted",
        user: { id: userId, email, role: "Applicant" },
        applicationId: app.recordset[0].application_id
      });
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// My latest application (logged in)
router.get("/my", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().input("uid", sql.Int, req.user.userId).query(`
      SELECT TOP 1 ja.*, r.role_name AS applied_role, d.dept_name AS applied_department
      FROM dbo.JobApplications ja
      JOIN dbo.Roles r ON r.role_id = ja.applied_role_id
      LEFT JOIN dbo.Departments d ON d.department_id = ja.applied_department_id
      WHERE ja.user_id=@uid
      ORDER BY ja.applied_at DESC
    `);
    res.json(r.recordset[0] || null);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// List all applications (admin/it will use in UI)
router.get("/", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT ja.*, u.email, u.full_name,
             rr.role_name AS applied_role,
             d.dept_name AS applied_department
      FROM dbo.JobApplications ja
      JOIN dbo.Users u ON u.user_id = ja.user_id
      JOIN dbo.Roles rr ON rr.role_id = ja.applied_role_id
      LEFT JOIN dbo.Departments d ON d.department_id = ja.applied_department_id
      ORDER BY ja.applied_at DESC
    `);
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

/*
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
*/


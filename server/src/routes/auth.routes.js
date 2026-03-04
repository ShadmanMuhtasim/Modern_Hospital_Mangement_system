// server/src/routes/auth.routes.js
const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const requireAuth = require("../middleware/requireAuth");
const { getPool, sql } = require("../config/db");

/**
 * Role priority: used to select a single "primary" role for UI compatibility
 * (your frontend currently expects user.role sometimes)
 */
const ROLE_PRIORITY = ["Admin", "ITWorker", "Doctor", "Nurse", "Patient", "Donor", "Applicant"];

function pickPrimaryRole(roles = []) {
  for (const r of ROLE_PRIORITY) if (roles.includes(r)) return r;
  return roles[0] || "User";
}

/**
 * Helper: fetch roles list for a user
 */
async function getUserRoles(userId) {
  const pool = await getPool();
  const rolesRes = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT r.role_name
      FROM dbo.UserRoles ur
      JOIN dbo.Roles r ON r.role_id = ur.role_id
      WHERE ur.user_id = @userId
    `);

  return rolesRes.recordset.map((x) => x.role_name);
}

/**
 * Helper: fetch profiles for a user (patient/doctor/nurse/donor + latest job app)
 */
async function getProfiles(userId) {
  const pool = await getPool();

  const patientRes = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`SELECT * FROM dbo.Patients WHERE patient_id=@userId`);

  const doctorRes = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT d.*, dep.dept_name
      FROM dbo.Doctors d
      JOIN dbo.Departments dep ON dep.department_id = d.department_id
      WHERE d.doctor_id=@userId
    `);

  const nurseRes = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT n.*, dep.dept_name
      FROM dbo.Nurses n
      JOIN dbo.Departments dep ON dep.department_id = n.department_id
      WHERE n.nurse_id=@userId
    `);

  // ITWorker has no separate profile table in our DB-first schema
  // Department scope exists in DepartmentAdmins
  const itDeptRes = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT da.department_id, dep.dept_name
      FROM dbo.DepartmentAdmins da
      JOIN dbo.Departments dep ON dep.department_id = da.department_id
      WHERE da.user_id=@userId
    `);

  const donorRes = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`SELECT * FROM dbo.DonorProfiles WHERE donor_id=@userId`);

  const latestAppRes = await pool
    .request()
    .input("userId", sql.Int, userId)
    .query(`
      SELECT TOP 1 *
      FROM dbo.JobApplications
      WHERE user_id=@userId
      ORDER BY applied_at DESC
    `);

  return {
    patient: patientRes.recordset[0] || null,
    doctor: doctorRes.recordset[0] || null,
    nurse: nurseRes.recordset[0] || null,
    itDepartments: itDeptRes.recordset || [],
    donor: donorRes.recordset[0] || null,
    latestApplication: latestAppRes.recordset[0] || null,
  };
}

/**
 * REGISTER (Patient only)
 * Keeps your existing frontend fields:
 * { fullName, phone, email, password, sex, age, address, bloodGroup }
 *
 * Notes:
 * - Our DB schema doesn't store "address" directly (yet) -> ignored for now
 * - "age" is used to approximate date_of_birth (year-based) for now
 */
router.post("/register", async (req, res) => {
  try {
    const { fullName, phone, email, password, sex, age, address, bloodGroup } = req.body || {};

    if (!fullName || !phone || !email || !password || !sex || !age || !bloodGroup) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const pool = await getPool();

    // check email exists
    const existing = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query(`SELECT user_id FROM dbo.Users WHERE email=@email`);

    if (existing.recordset.length > 0) {
      return res.status(409).json({ message: "Email already used" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Approx DOB from age (rough): today - age years
    const ageNum = Number(age);
    const dob =
      Number.isFinite(ageNum) && ageNum > 0 && ageNum < 130
        ? new Date(new Date().setFullYear(new Date().getFullYear() - ageNum))
        : null;

    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      // 1) insert into Users
      const userInsert = await new sql.Request(tx)
        .input("email", sql.NVarChar, email)
        .input("password_hash", sql.NVarChar, passwordHash)
        .input("full_name", sql.NVarChar, fullName)
        .input("phone", sql.NVarChar, phone)
        .input("gender", sql.NVarChar, sex)
        .input("dob", sql.Date, dob ? dob : null)
        .query(`
          INSERT INTO dbo.Users (email, password_hash, full_name, phone, gender, date_of_birth, account_status)
          OUTPUT INSERTED.user_id
          VALUES (@email, @password_hash, @full_name, @phone, @gender, @dob, 'Active')
        `);

      const userId = userInsert.recordset[0].user_id;

      // 2) assign Patient role
      const roleRes = await new sql.Request(tx)
        .input("role_name", sql.NVarChar, "Patient")
        .query(`SELECT role_id FROM dbo.Roles WHERE role_name=@role_name`);

      const patientRoleId = roleRes.recordset?.[0]?.role_id;
      if (!patientRoleId) throw new Error("Patient role missing in Roles table. Run seed_data.sql again.");

      await new sql.Request(tx)
        .input("user_id", sql.Int, userId)
        .input("role_id", sql.Int, patientRoleId)
        .query(`INSERT INTO dbo.UserRoles (user_id, role_id) VALUES (@user_id, @role_id)`);

      // 3) create Patients profile
      await new sql.Request(tx)
        .input("patient_id", sql.Int, userId)
        .input("blood_group", sql.NVarChar, bloodGroup)
        .query(`
          INSERT INTO dbo.Patients (patient_id, blood_group)
          VALUES (@patient_id, @blood_group)
        `);

      await tx.commit();

      return res.status(201).json({
        message: "Registered",
        user: { id: userId, email, role: "Patient" },
        note: address ? "Address received but not stored in DB schema yet." : undefined,
      });
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

/**
 * LOGIN (any role)
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const pool = await getPool();

    const userRes = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query(`
        SELECT user_id, email, password_hash, full_name, account_status
        FROM dbo.Users
        WHERE email=@email
      `);

    const user = userRes.recordset[0];
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.account_status !== "Active") return res.status(403).json({ message: "Account is not active" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const roles = await getUserRoles(user.user_id);
    const primaryRole = pickPrimaryRole(roles);

    const token = jwt.sign(
      { userId: user.user_id, roles, role: primaryRole },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const profiles = await getProfiles(user.user_id);

    return res.json({
      token,
      user: {
        id: user.user_id,
        email: user.email,
        role: primaryRole,     // for existing UI compatibility
        roles,                 // future-proof
        fullName: user.full_name,
      },
      profiles: {
        patient: profiles.patient,
        doctor: profiles.doctor,
        nurse: profiles.nurse,
        itDepartments: profiles.itDepartments,
        donor: profiles.donor,
      },
      latestApplication: profiles.latestApplication,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

/**
 * /me
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "No userId in token" });

    const pool = await getPool();
    const userRes = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        SELECT user_id, email, full_name, account_status
        FROM dbo.Users
        WHERE user_id=@userId
      `);

    const user = userRes.recordset[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const roles = await getUserRoles(user.user_id);
    const primaryRole = pickPrimaryRole(roles);
    const profiles = await getProfiles(user.user_id);

    return res.json({
      user: {
        id: user.user_id,
        email: user.email,
        role: primaryRole,
        roles,
        fullName: user.full_name,
        accountStatus: user.account_status,
      },
      profiles: {
        patient: profiles.patient,
        doctor: profiles.doctor,
        nurse: profiles.nurse,
        itDepartments: profiles.itDepartments,
        donor: profiles.donor,
      },
      latestApplication: profiles.latestApplication,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

module.exports = router;

/*
const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");

// Register patient only (keep)
router.post("/register", async (req, res) => {
  try {
    const { fullName, phone, email, password, sex, age, address, bloodGroup } = req.body;

    if (!fullName || !phone || !email || !password || !sex || !age || !address || !bloodGroup) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "PATIENT",
        patientProfile: {
          create: { fullName, phone, sex, age: Number(age), address, bloodGroup },
        },
      },
      include: { patientProfile: true },
    });

    return res.status(201).json({
      message: "Registered",
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

// Login for ANY role
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patientProfile: true,
        doctorProfile: true,
        nurseProfile: true,
        itWorkerProfile: true,
        donorProfile: true,
        applicantApplications: { orderBy: { appliedAt: "desc" }, take: 1 },
      },
    });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
      profiles: {
        patient: user.patientProfile,
        doctor: user.doctorProfile,
        nurse: user.nurseProfile,
        it: user.itWorkerProfile,
        donor: user.donorProfile,
      },
      latestApplication: user.applicantApplications?.[0] || null,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

// /me for any role
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        patientProfile: true,
        doctorProfile: true,
        nurseProfile: true,
        itWorkerProfile: true,
        donorProfile: true,
        applicantApplications: { orderBy: { appliedAt: "desc" }, take: 1 },
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      user: { id: user.id, email: user.email, role: user.role },
      profiles: {
        patient: user.patientProfile,
        doctor: user.doctorProfile,
        nurse: user.nurseProfile,
        it: user.itWorkerProfile,
        donor: user.donorProfile,
      },
      latestApplication: user.applicantApplications?.[0] || null,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

module.exports = router;

*/
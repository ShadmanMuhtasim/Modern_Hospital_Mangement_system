const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getPool, sql } = require("../config/db");

function pickPrimaryRole(roles = []) {
  const priority = ["Admin", "ITWorker", "Doctor", "Nurse", "Patient", "Donor", "Applicant"];
  for (const r of priority) if (roles.includes(r)) return r;
  return roles[0] || "User";
}

async function getRoles(userId) {
  const pool = await getPool();
  const r = await pool.request().input("uid", sql.Int, userId).query(`
    SELECT r.role_name
    FROM dbo.UserRoles ur
    JOIN dbo.Roles r ON r.role_id = ur.role_id
    WHERE ur.user_id=@uid
  `);
  return r.recordset.map(x => x.role_name);
}

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, phone, dob, bloodGroup } = req.body || {};
    if (!fullName || !email || !password || !bloodGroup) {
      return res.status(400).json({ message: "fullName, email, password, bloodGroup are required" });
    }

    const pool = await getPool();

    const existing = await pool.request().input("email", sql.NVarChar, email)
      .query(`SELECT user_id FROM dbo.Users WHERE email=@email`);
    if (existing.recordset.length) return res.status(409).json({ message: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);

    const tx = new sql.Transaction(pool);
    await tx.begin();

    try {
      const dobVal = dob ? new Date(dob) : null;

      const u = await new sql.Request(tx)
        .input("email", sql.NVarChar, email)
        .input("password_hash", sql.NVarChar, passwordHash)
        .input("full_name", sql.NVarChar, fullName)
        .input("phone", sql.NVarChar, phone || null)
        .input("dob", sql.Date, dobVal)
        .query(`
          INSERT INTO dbo.Users(email,password_hash,full_name,phone,date_of_birth,account_status)
          OUTPUT INSERTED.user_id
          VALUES (@email,@password_hash,@full_name,@phone,@dob,'Active')
        `);

      const userId = u.recordset[0].user_id;

      const role = await new sql.Request(tx)
        .input("r", sql.NVarChar, "Donor")
        .query(`SELECT role_id FROM dbo.Roles WHERE role_name=@r`);
      const roleId = role.recordset?.[0]?.role_id;
      if (!roleId) throw new Error("Donor role missing. Run seed_data.sql");

      await new sql.Request(tx)
        .input("uid", sql.Int, userId)
        .input("rid", sql.Int, roleId)
        .query(`INSERT INTO dbo.UserRoles(user_id,role_id) VALUES (@uid,@rid)`);

      await new sql.Request(tx)
        .input("did", sql.Int, userId)
        .input("bg", sql.NVarChar, String(bloodGroup).toUpperCase().replace(/\s+/g, ""))
        .query(`INSERT INTO dbo.DonorProfiles(donor_id,blood_group) VALUES (@did,@bg)`);

      await tx.commit();

      res.status(201).json({ message: "Donor registered", user: { id: userId, email, role: "Donor" } });
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const pool = await getPool();
    const userRes = await pool.request().input("email", sql.NVarChar, email).query(`
      SELECT user_id,email,password_hash,full_name,account_status
      FROM dbo.Users WHERE email=@email
    `);
    const user = userRes.recordset[0];
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.account_status !== "Active") return res.status(403).json({ message: "Account is not active" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const roles = await getRoles(user.user_id);
    if (!roles.includes("Donor")) return res.status(403).json({ message: "Not a donor account" });

    const primary = pickPrimaryRole(roles);
    const token = jwt.sign({ userId: user.user_id, roles, role: primary }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id: user.user_id, email: user.email, role: primary, roles, fullName: user.full_name } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;




/*
const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, phone, dob, bloodGroup } = req.body || {};
    if (!fullName || !email || !password || !bloodGroup) {
      return res.status(400).json({ message: "fullName, email, password, bloodGroup are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash, role: "BLOOD_DONOR" },
    });

    const donor = await prisma.bloodDonor.create({
      data: {
        fullName,
        phone: phone || null,
        dob: dob ? new Date(dob) : null,
        bloodGroup: String(bloodGroup).toUpperCase().replace(/\s+/g, ""),
        userId: user.id,
      },
    });

    res.status(201).json({ message: "Donor registered", user: { id: user.id, email: user.email, role: user.role }, donor });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const user = await prisma.user.findUnique({ where: { email }, include: { donorProfile: true } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.role !== "BLOOD_DONOR") return res.status(403).json({ message: "Not a donor account" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id: user.id, email: user.email, role: user.role }, donor: user.donorProfile });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
*/
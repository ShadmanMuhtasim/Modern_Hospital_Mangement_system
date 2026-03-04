const router = require("express").Router();
const bcrypt = require("bcrypt");
const { getPool, sql } = require("../config/db");

// DEV ONLY: create an admin user if not exists
router.post("/create-admin", async (req, res) => {
  try {
    const { email, password, fullName } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

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
        .input("full_name", sql.NVarChar, fullName || "Admin")
        .query(`
          INSERT INTO dbo.Users(email,password_hash,full_name,account_status)
          OUTPUT INSERTED.user_id
          VALUES (@email,@password_hash,@full_name,'Active')
        `);

      const userId = u.recordset[0].user_id;

      const role = await new sql.Request(tx)
        .input("r", sql.NVarChar, "Admin")
        .query(`SELECT role_id FROM dbo.Roles WHERE role_name=@r`);
      const roleId = role.recordset?.[0]?.role_id;
      if (!roleId) throw new Error("Admin role missing. Run seed_data.sql");

      await new sql.Request(tx)
        .input("uid", sql.Int, userId)
        .input("rid", sql.Int, roleId)
        .query(`INSERT INTO dbo.UserRoles(user_id,role_id) VALUES (@uid,@rid)`);

      await tx.commit();

      res.status(201).json({ message: "Admin created", user: { id: userId, email, role: "Admin" } });
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

/*
const router = require("express").Router();
const bcrypt = require("bcrypt");
const prisma = require("../prismaClient");

// DEV ONLY: create an admin user if not exists
router.post("/create-admin", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash, role: "ADMIN" },
    });

    res.status(201).json({ message: "Admin created", user: { id: user.id, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
*/
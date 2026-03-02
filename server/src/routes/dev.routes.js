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
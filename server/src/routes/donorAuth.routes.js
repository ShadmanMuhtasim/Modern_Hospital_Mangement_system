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
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


/*const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");


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
          create: {
            fullName,
            phone,
            sex,
            age: Number(age),
            address,
            bloodGroup,
          },
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


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const user = await prisma.user.findUnique({
      where: { email },
      include: { patientProfile: true },
    });

    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.role !== "PATIENT") return res.status(403).json({ message: "Only patient login is enabled right now" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
      patient: user.patientProfile,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});


router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { patientProfile: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({
      user: { id: user.id, email: user.email, role: user.role },
      patient: user.patientProfile,
    });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

module.exports = router;*/
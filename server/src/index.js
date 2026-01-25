require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { getPool } = require("./config/db");


const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT 1 AS ok");
    res.json({ api: true, db: result.recordset[0].ok === 1 });
  } catch (err) {
    res.status(500).json({ api: true, db: false, error: err.message });
  }
});


// TEST: raw SQL query to fetch patients
app.get("/patients", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT TOP 20 * FROM Patient ORDER BY id DESC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const bcrypt = require("bcryptjs");
const prisma = require("./prismaClient");

app.post("/users", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "email, password, role are required" });
  }

  try {
    // Optional: allow only ONE admin
    if (role === "ADMIN") {
      const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (existingAdmin) {
        return res.status(400).json({ error: "Admin already exists" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash, role },
    });

    // Don’t return passwordHash in response
    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));

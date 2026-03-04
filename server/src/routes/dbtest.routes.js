const router = require("express").Router();
const { getPool } = require("../config/db");

router.get("/ping", async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query("SELECT 1 AS ok");
    res.json({ db: "connected", result: r.recordset[0] });
  } catch (e) {
    res.status(500).json({ db: "failed", message: e.message });
  }
});

module.exports = router;
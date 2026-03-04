const router = require("express").Router();
const requireAuth = require("../middleware/requireAuth");
const { getPool, sql } = require("../config/db");

// 1) List care units
router.get("/units", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT cu.care_unit_id, cu.unit_type, cu.floor, cu.unit_name,
             d.department_id, d.dept_name
      FROM dbo.CareUnits cu
      JOIN dbo.Departments d ON d.department_id = cu.department_id
      WHERE cu.is_active=1
      ORDER BY d.dept_name, cu.unit_type, cu.care_unit_id
    `);
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 2) Bed availability summary
router.get("/beds/summary", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT d.dept_name, cu.unit_type, b.status, COUNT(*) AS count
      FROM dbo.Beds b
      JOIN dbo.CareUnits cu ON cu.care_unit_id = b.care_unit_id
      JOIN dbo.Departments d ON d.department_id = cu.department_id
      WHERE b.is_active=1
      GROUP BY d.dept_name, cu.unit_type, b.status
      ORDER BY d.dept_name, cu.unit_type, b.status
    `);
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 3) List beds (optional filters: departmentId, unitType, status)
router.get("/beds", requireAuth, async (req, res) => {
  try {
    const { departmentId, unitType, status } = req.query || {};
    const pool = await getPool();

    const reqq = pool.request();
    let where = `WHERE b.is_active=1`;

    if (departmentId) {
      where += ` AND cu.department_id=@deptId`;
      reqq.input("deptId", sql.Int, Number(departmentId));
    }
    if (unitType) {
      where += ` AND cu.unit_type=@unitType`;
      reqq.input("unitType", sql.NVarChar, String(unitType));
    }
    if (status) {
      where += ` AND b.status=@status`;
      reqq.input("status", sql.NVarChar, String(status));
    }

    const r = await reqq.query(`
      SELECT b.bed_id, b.bed_code, b.status,
             cu.unit_type, cu.care_unit_id,
             d.department_id, d.dept_name
      FROM dbo.Beds b
      JOIN dbo.CareUnits cu ON cu.care_unit_id = b.care_unit_id
      JOIN dbo.Departments d ON d.department_id = cu.department_id
      ${where}
      ORDER BY d.dept_name, cu.unit_type, b.bed_code
    `);

    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

/*
const router = require("express").Router();
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");

// 1) List ward units
router.get("/units", requireAuth, async (req, res) => {
  try {
    const units = await prisma.wardUnit.findMany({
      orderBy: [{ unitType: "asc" }, { id: "asc" }],
    });
    res.json(units);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 2) Bed availability summary by unitType (DB aggregation)
router.get("/beds/summary", requireAuth, async (req, res) => {
  try {
    const rows = await prisma.bed.groupBy({
      by: ["unitId", "status"],
      _count: { id: true },
    });

    // join unitType for readable output
    const units = await prisma.wardUnit.findMany({ select: { id: true, unitType: true } });
    const unitMap = new Map(units.map((u) => [u.id, u.unitType]));

    // shape: unitType -> { AVAILABLE, OCCUPIED, MAINTENANCE, total }
    const summary = {};
    for (const r of rows) {
      const unitType = unitMap.get(r.unitId) || `UNIT_${r.unitId}`;
      summary[unitType] ||= { AVAILABLE: 0, OCCUPIED: 0, MAINTENANCE: 0, total: 0 };
      summary[unitType][r.status] = r._count.id;
      summary[unitType].total += r._count.id;
    }

    // return as array for UI
    const result = Object.entries(summary).map(([unitType, stats]) => ({
      unitType,
      ...stats,
    }));

    res.json(result.sort((a, b) => a.unitType.localeCompare(b.unitType)));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 3) List beds (filter by unitId and/or status)
router.get("/beds", requireAuth, async (req, res) => {
  try {
    const unitId = req.query.unitId ? Number(req.query.unitId) : null;
    const status = req.query.status ? String(req.query.status).toUpperCase() : null;

    const where = {};
    if (unitId) where.unitId = unitId;
    if (status) where.status = status;

    const beds = await prisma.bed.findMany({
      where,
      orderBy: [{ unitId: "asc" }, { bedNumber: "asc" }],
    });

    res.json(beds);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 4) Update bed status (DB update)
router.patch("/beds/:bedId/status", requireAuth, async (req, res) => {
  try {
    const bedId = Number(req.params.bedId);
    const { status } = req.body;

    if (!status) return res.status(400).json({ message: "status is required" });

    const normalized = String(status).toUpperCase();
    const allowed = ["AVAILABLE", "OCCUPIED", "MAINTENANCE"];
    if (!allowed.includes(normalized)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });
    }

    const updated = await prisma.bed.update({
      where: { id: bedId },
      data: { status: normalized },
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
*/
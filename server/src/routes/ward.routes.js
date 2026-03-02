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
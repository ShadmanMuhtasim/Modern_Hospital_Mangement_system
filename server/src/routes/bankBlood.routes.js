const router = require("express").Router();
const requireAuth = require("../middleware/requireAuth");
const { getPool, sql } = require("../config/db");
const { getCompatibleDonorGroups, normalizeGroup } = require("../utils/bloodCompatibility");

// 1) List blood banks
router.get("/banks", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`SELECT * FROM dbo.BloodBanks WHERE is_active=1 ORDER BY blood_bank_id`);
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 2) Bank inventory
router.get("/banks/:bankId/inventory", requireAuth, async (req, res) => {
  try {
    const bankId = Number(req.params.bankId);
    const pool = await getPool();

    const r = await pool.request().input("bid", sql.Int, bankId).query(`
      SELECT blood_group, component_type, units_available
      FROM dbo.BloodInventory
      WHERE blood_bank_id=@bid
      ORDER BY blood_group, component_type
    `);

    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 3) Register donor (creates donor profile for an existing logged-in user)
router.post("/donors/register", requireAuth, async (req, res) => {
  try {
    const { bloodGroup } = req.body || {};
    if (!bloodGroup) return res.status(400).json({ message: "bloodGroup is required" });

    const pool = await getPool();
    const bg = normalizeGroup(bloodGroup);

    // if already donor profile, return it
    const existing = await pool.request().input("uid", sql.Int, req.user.userId)
      .query(`SELECT * FROM dbo.DonorProfiles WHERE donor_id=@uid`);
    if (existing.recordset.length) return res.json(existing.recordset[0]);

    await pool.request()
      .input("uid", sql.Int, req.user.userId)
      .input("bg", sql.NVarChar, bg)
      .query(`INSERT INTO dbo.DonorProfiles(donor_id,blood_group) VALUES (@uid,@bg)`);

    const donor = await pool.request().input("uid", sql.Int, req.user.userId)
      .query(`SELECT * FROM dbo.DonorProfiles WHERE donor_id=@uid`);

    res.status(201).json(donor.recordset[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 4) Donate to specific bank (IT worker/admin can record)
router.post("/banks/:bankId/donate", requireAuth, async (req, res) => {
  try {
    const bankId = Number(req.params.bankId);
    const { donorUserId, bloodGroup, units } = req.body || {};
    const unitsNum = Number(units);

    if (!donorUserId || !bloodGroup || !unitsNum || unitsNum <= 0) {
      return res.status(400).json({ message: "donorUserId, bloodGroup, units are required" });
    }

    const pool = await getPool();
    const bg = normalizeGroup(bloodGroup);

    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const donation = await new sql.Request(tx)
        .input("donor_id", sql.Int, Number(donorUserId))
        .input("bank_id", sql.Int, bankId)
        .input("bg", sql.NVarChar, bg)
        .input("ct", sql.NVarChar, "WholeBlood")
        .input("units", sql.Int, unitsNum)
        .input("by", sql.Int, req.user.userId)
        .query(`
          INSERT INTO dbo.BloodDonations(donor_id,blood_bank_id,blood_group,component_type,units_donated,recorded_by_user_id)
          OUTPUT INSERTED.donation_id
          VALUES (@donor_id,@bank_id,@bg,@ct,@units,@by)
        `);

      const donationId = donation.recordset[0].donation_id;

      await new sql.Request(tx)
        .input("bank_id", sql.Int, bankId)
        .input("donation_id", sql.Int, donationId)
        .input("bg", sql.NVarChar, bg)
        .input("ct", sql.NVarChar, "WholeBlood")
        .input("chg", sql.Int, unitsNum)
        .input("by", sql.Int, req.user.userId)
        .query(`
          INSERT INTO dbo.BloodInventoryTransactions(blood_bank_id,donation_id,blood_group,component_type,units_change,reason,created_by_user_id)
          VALUES (@bank_id,@donation_id,@bg,@ct,@chg,'Donation',@by)
        `);

      await new sql.Request(tx)
        .input("bank_id", sql.Int, bankId)
        .input("bg", sql.NVarChar, bg)
        .input("ct", sql.NVarChar, "WholeBlood")
        .input("chg", sql.Int, unitsNum)
        .query(`
          UPDATE dbo.BloodInventory
          SET units_available = units_available + @chg,
              last_updated_at = SYSUTCDATETIME()
          WHERE blood_bank_id=@bank_id AND blood_group=@bg AND component_type=@ct
        `);

      await tx.commit();
      res.status(201).json({ message: "Donation recorded", donationId });
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 5) Create a blood request (bank/IT side)
router.post("/banks/:bankId/request", requireAuth, async (req, res) => {
  try {
    const bankId = Number(req.params.bankId); // not used for request table currently (requests are dept based)
    const { patientUserId, departmentId, bloodGroup, unitsRequired } = req.body || {};

    if (!patientUserId || !departmentId || !bloodGroup || !unitsRequired) {
      return res.status(400).json({ message: "patientUserId, departmentId, bloodGroup, unitsRequired are required" });
    }

    const pool = await getPool();
    const bg = normalizeGroup(bloodGroup);

    const r = await pool.request()
      .input("pid", sql.Int, Number(patientUserId))
      .input("dept", sql.Int, Number(departmentId))
      .input("by", sql.Int, req.user.userId)
      .input("bg", sql.NVarChar, bg)
      .input("ct", sql.NVarChar, "WholeBlood")
      .input("units", sql.Int, Number(unitsRequired))
      .input("urg", sql.NVarChar, "Urgent")
      .query(`
        INSERT INTO dbo.BloodRequests(patient_id,department_id,requested_by_user_id,blood_group_needed,component_type,units_required,urgency,status)
        OUTPUT INSERTED.request_id
        VALUES (@pid,@dept,@by,@bg,@ct,@units,@urg,'Pending')
      `);

    res.status(201).json({ message: "Request created", requestId: r.recordset[0].request_id, bankId });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 6) Issue blood for a request (reduce inventory, set request status)
router.post("/requests/:requestId/issue", requireAuth, async (req, res) => {
  try {
    const requestId = Number(req.params.requestId);
    const { bankId } = req.body || {};
    const bank = Number(bankId);

    if (!bank) return res.status(400).json({ message: "bankId is required" });

    const pool = await getPool();

    const reqRes = await pool.request().input("rid", sql.Int, requestId).query(`
      SELECT * FROM dbo.BloodRequests WHERE request_id=@rid
    `);
    const reqRow = reqRes.recordset[0];
    if (!reqRow) return res.status(404).json({ message: "Request not found" });

    const needBG = reqRow.blood_group_needed;
    const needUnits = reqRow.units_required;

    // check inventory (same blood group)
    const inv = await pool.request()
      .input("bid", sql.Int, bank)
      .input("bg", sql.NVarChar, needBG)
      .input("ct", sql.NVarChar, "WholeBlood")
      .query(`
        SELECT units_available FROM dbo.BloodInventory
        WHERE blood_bank_id=@bid AND blood_group=@bg AND component_type=@ct
      `);
    const available = inv.recordset?.[0]?.units_available ?? 0;
    if (available < needUnits) return res.status(400).json({ message: "Not enough inventory", available });

    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      await new sql.Request(tx)
        .input("rid", sql.Int, requestId)
        .query(`UPDATE dbo.BloodRequests SET status='Fulfilled' WHERE request_id=@rid`);

      await new sql.Request(tx)
        .input("bid", sql.Int, bank)
        .input("bg", sql.NVarChar, needBG)
        .input("ct", sql.NVarChar, "WholeBlood")
        .input("chg", sql.Int, -needUnits)
        .input("by", sql.Int, req.user.userId)
        .input("rid", sql.Int, requestId)
        .query(`
          INSERT INTO dbo.BloodInventoryTransactions(blood_bank_id,request_id,blood_group,component_type,units_change,reason,created_by_user_id)
          VALUES (@bid,@rid,@bg,@ct,@chg,'Fulfillment',@by)
        `);

      await new sql.Request(tx)
        .input("bid", sql.Int, bank)
        .input("bg", sql.NVarChar, needBG)
        .input("ct", sql.NVarChar, "WholeBlood")
        .input("need", sql.Int, needUnits)
        .query(`
          UPDATE dbo.BloodInventory
          SET units_available = units_available - @need,
              last_updated_at = SYSUTCDATETIME()
          WHERE blood_bank_id=@bid AND blood_group=@bg AND component_type=@ct
        `);

      await tx.commit();
      res.json({ message: "Issued / fulfilled", requestId, issuedUnits: needUnits });
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
const prisma = require("../prismaClient");
const requireAuth = require("../middleware/requireAuth");
const { getCompatibleDonorGroups, normalizeGroup } = require("../utils/bloodCompatibility");

// 1) List blood banks
router.get("/banks", requireAuth, async (req, res) => {
  try {
    const banks = await prisma.bloodBank.findMany({ orderBy: { id: "asc" } });
    res.json(banks);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 2) Bank inventory
router.get("/banks/:bankId/inventory", requireAuth, async (req, res) => {
  try {
    const bankId = Number(req.params.bankId);
    const list = await prisma.bankBloodInventory.findMany({
      where: { bankId },
      orderBy: { bloodGroup: "asc" },
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 3) Register non-patient donor
router.post("/donors/register", requireAuth, async (req, res) => {
  try {
    const { fullName, phone, dob, bloodGroup } = req.body;
    if (!fullName || !bloodGroup) {
      return res.status(400).json({ message: "fullName and bloodGroup are required" });
    }

    const donor = await prisma.bloodDonor.create({
      data: {
        fullName,
        phone: phone || null,
        dob: dob ? new Date(dob) : null,
        bloodGroup: normalizeGroup(bloodGroup),
      },
    });

    res.status(201).json(donor);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 4) Donate to bank (increments bank inventory)
router.post("/banks/:bankId/donate", requireAuth, async (req, res) => {
  try {
    const bankId = Number(req.params.bankId);
    const { donorId, unitsDonated } = req.body;

    if (!donorId || !unitsDonated) {
      return res.status(400).json({ message: "donorId and unitsDonated are required" });
    }
    if (Number(unitsDonated) <= 0) {
      return res.status(400).json({ message: "unitsDonated must be > 0" });
    }

    const donor = await prisma.bloodDonor.findUnique({ where: { id: Number(donorId) } });
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    const donation = await prisma.bankDonation.create({
      data: {
        bankId,
        donorId: donor.id,
        bloodGroup: donor.bloodGroup,
        unitsDonated: Number(unitsDonated),
        status: "APPROVED",
      },
    });

    await prisma.bankBloodInventory.upsert({
      where: { bankId_bloodGroup: { bankId, bloodGroup: donor.bloodGroup } },
      update: { unitsAvailable: { increment: Number(unitsDonated) } },
      create: { bankId, bloodGroup: donor.bloodGroup, unitsAvailable: Number(unitsDonated) },
    });

    await prisma.bloodDonor.update({
      where: { id: donor.id },
      data: { lastDonationDate: new Date() },
    });

    res.status(201).json({ donation, message: `Added ${unitsDonated} units to ${donor.bloodGroup} at bank ${bankId}` });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 5) Patient requests blood from a bank
router.post("/banks/:bankId/request", requireAuth, async (req, res) => {
  try {
    const bankId = Number(req.params.bankId);
    const { bloodGroup, unitsRequested } = req.body;

    if (!bloodGroup || !unitsRequested) {
      return res.status(400).json({ message: "bloodGroup and unitsRequested are required" });
    }
    if (Number(unitsRequested) <= 0) {
      return res.status(400).json({ message: "unitsRequested must be > 0" });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.userId },
      select: { id: true },
    });
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const created = await prisma.bankBloodRequest.create({
      data: {
        bankId,
        patientId: patient.id,
        bloodGroup: normalizeGroup(bloodGroup),
        unitsRequested: Number(unitsRequested),
        status: "PENDING",
      },
    });

    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 6) Issue/Fulfill request with compatibility + inventory decrement
router.post("/requests/:requestId/issue", requireAuth, async (req, res) => {
  try {
    const requestId = Number(req.params.requestId);
    const { unitsToIssue } = req.body;

    if (!unitsToIssue || Number(unitsToIssue) <= 0) {
      return res.status(400).json({ message: "unitsToIssue must be > 0" });
    }

    const request = await prisma.bankBloodRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.status === "FULFILLED") {
      return res.status(400).json({ message: "Request already fulfilled" });
    }

    const needed = Math.min(Number(unitsToIssue), request.unitsRequested);
    const compatibleGroups = getCompatibleDonorGroups(request.bloodGroup);

    if (compatibleGroups.length === 0) {
      return res.status(400).json({ message: "Invalid recipient bloodGroup" });
    }

    const inventories = await prisma.bankBloodInventory.findMany({
      where: { bankId: request.bankId, bloodGroup: { in: compatibleGroups } },
      orderBy: { unitsAvailable: "desc" },
    });

    let remaining = needed;
    const used = [];

    for (const inv of inventories) {
      if (remaining <= 0) break;
      if (inv.unitsAvailable <= 0) continue;

      const take = Math.min(inv.unitsAvailable, remaining);

      await prisma.bankBloodInventory.update({
        where: { id: inv.id },
        data: { unitsAvailable: { decrement: take } },
      });

      used.push({ bloodGroup: inv.bloodGroup, units: take });
      remaining -= take;
    }

    const issuedTotal = used.reduce((sum, x) => sum + x.units, 0);
    if (issuedTotal === 0) {
      return res.status(400).json({ message: "No compatible blood available in this bank" });
    }

    await prisma.$transaction(
      used.map((u) =>
        prisma.bloodIssue.create({
          data: {
            bankId: request.bankId,
            requestId: request.id,
            unitsIssued: u.units,
            issuedGroup: u.bloodGroup,
            status: "ISSUED",
          },
        })
      )
    );

    const newStatus = issuedTotal >= request.unitsRequested ? "FULFILLED" : "APPROVED";
    const updatedRequest = await prisma.bankBloodRequest.update({
      where: { id: request.id },
      data: { status: newStatus },
    });

    res.json({
      message: "Issued blood successfully",
      issuedTotal,
      used,
      request: updatedRequest,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
*/
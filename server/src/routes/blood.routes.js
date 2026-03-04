const router = require("express").Router();
const requireAuth = require("../middleware/requireAuth");
const { getPool, sql } = require("../config/db");

// helper: get main blood bank id
async function getMainBankId(pool) {
  const r = await pool.request().query(`SELECT TOP 1 blood_bank_id FROM dbo.BloodBanks ORDER BY blood_bank_id`);
  return r.recordset?.[0]?.blood_bank_id || null;
}

// ✅ Inventory (visible to patients): from Main bank, WholeBlood
router.get("/inventory", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const bankId = await getMainBankId(pool);
    if (!bankId) return res.status(404).json({ message: "No blood bank found" });

    const r = await pool.request()
      .input("bid", sql.Int, bankId)
      .query(`
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

// ✅ Request blood (patient): creates BloodRequests
router.post("/request", requireAuth, async (req, res) => {
  try {
    const { bloodGroup, unitsRequested } = req.body || {};
    if (!bloodGroup || !unitsRequested) return res.status(400).json({ message: "bloodGroup and unitsRequested are required" });
    if (Number(unitsRequested) <= 0) return res.status(400).json({ message: "unitsRequested must be > 0" });

    const pool = await getPool();

    // ensure patient profile
    const p = await pool.request().input("uid", sql.Int, req.user.userId)
      .query(`SELECT blood_group FROM dbo.Patients WHERE patient_id=@uid`);
    if (!p.recordset.length) return res.status(404).json({ message: "Patient profile not found" });

    // pick patient's latest admitted dept if exists; else General Medicine
    const dep = await pool.request().input("pid", sql.Int, req.user.userId).query(`
      SELECT TOP 1 department_id
      FROM dbo.Admissions
      WHERE patient_id=@pid
      ORDER BY admission_id DESC
    `);

    let deptId = dep.recordset?.[0]?.department_id || null;
    if (!deptId) {
      const d2 = await pool.request().input("dn", sql.NVarChar, "General Medicine")
        .query(`SELECT TOP 1 department_id FROM dbo.Departments WHERE dept_name=@dn`);
      deptId = d2.recordset?.[0]?.department_id;
    }

    const r = await pool.request()
      .input("patient_id", sql.Int, req.user.userId)
      .input("department_id", sql.Int, deptId)
      .input("requested_by", sql.Int, req.user.userId)
      .input("bg", sql.NVarChar, String(bloodGroup).toUpperCase().replace(/\s+/g, ""))
      .input("ct", sql.NVarChar, "WholeBlood")
      .input("units", sql.Int, Number(unitsRequested))
      .input("urgency", sql.NVarChar, "Urgent")
      .query(`
        INSERT INTO dbo.BloodRequests(patient_id,department_id,requested_by_user_id,blood_group_needed,component_type,units_required,urgency,status)
        OUTPUT INSERTED.request_id
        VALUES (@patient_id,@department_id,@requested_by,@bg,@ct,@units,@urgency,'Pending')
      `);

    res.status(201).json({ message: "Request submitted", requestId: r.recordset[0].request_id });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ✅ Donor donate (simple): add donation to Main bank (+inventory)
router.post("/donate", requireAuth, async (req, res) => {
  try {
    const { units } = req.body || {};
    const unitsNum = Number(units);
    if (!unitsNum || unitsNum <= 0) return res.status(400).json({ message: "units must be > 0" });

    const pool = await getPool();

    // ensure donor profile
    const d = await pool.request().input("uid", sql.Int, req.user.userId)
      .query(`SELECT blood_group FROM dbo.DonorProfiles WHERE donor_id=@uid`);
    if (!d.recordset.length) return res.status(404).json({ message: "Donor profile not found" });

    const donorBG = d.recordset[0].blood_group;
    const bankId = await getMainBankId(pool);
    if (!bankId) return res.status(404).json({ message: "No blood bank found" });

    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const donation = await new sql.Request(tx)
        .input("donor_id", sql.Int, req.user.userId)
        .input("bank_id", sql.Int, bankId)
        .input("bg", sql.NVarChar, donorBG)
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
        .input("bg", sql.NVarChar, donorBG)
        .input("ct", sql.NVarChar, "WholeBlood")
        .input("chg", sql.Int, unitsNum)
        .input("by", sql.Int, req.user.userId)
        .query(`
          INSERT INTO dbo.BloodInventoryTransactions(blood_bank_id,donation_id,blood_group,component_type,units_change,reason,created_by_user_id)
          VALUES (@bank_id,@donation_id,@bg,@ct,@chg,'Donation',@by)
        `);

      await new sql.Request(tx)
        .input("bank_id", sql.Int, bankId)
        .input("bg", sql.NVarChar, donorBG)
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

// ✅ My requests (patient)
router.get("/requests/my", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().input("pid", sql.Int, req.user.userId).query(`
      SELECT *
      FROM dbo.BloodRequests
      WHERE patient_id=@pid
      ORDER BY request_id DESC
    `);
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ✅ My donations (donor)
router.get("/donations/my", requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().input("did", sql.Int, req.user.userId).query(`
      SELECT *
      FROM dbo.BloodDonations
      WHERE donor_id=@did
      ORDER BY donation_id DESC
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

// helper: find patient by JWT userId
async function getPatientByUserId(userId) {
  return prisma.patient.findUnique({
    where: { userId },
    select: { id: true, bloodGroup: true, fullName: true },
  });
}

// ✅ Global inventory (visible to patients)
router.get("/inventory", requireAuth, async (req, res) => {
  try {
    const list = await prisma.bloodInventory.findMany({ orderBy: { bloodGroup: "asc" } });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ✅ Request blood: PENDING
router.post("/request", requireAuth, async (req, res) => {
  try {
    const { bloodGroup, unitsRequested } = req.body;

    if (!bloodGroup || !unitsRequested) {
      return res.status(400).json({ message: "bloodGroup and unitsRequested are required" });
    }
    if (Number(unitsRequested) <= 0) {
      return res.status(400).json({ message: "unitsRequested must be > 0" });
    }

    const patient = await getPatientByUserId(req.user.userId);
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const created = await prisma.bloodRequest.create({
      data: {
        patientId: patient.id,
        bloodGroup,
        unitsRequested: Number(unitsRequested),
        status: "PENDING",
      },
    });

    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ✅ Donate blood: auto-approved and MUST match patient bloodGroup
router.post("/donate", requireAuth, async (req, res) => {
  try {
    const { unitsDonated } = req.body;

    if (!unitsDonated) return res.status(400).json({ message: "unitsDonated is required" });
    if (Number(unitsDonated) <= 0) return res.status(400).json({ message: "unitsDonated must be > 0" });

    const patient = await getPatientByUserId(req.user.userId);
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });
    if (!patient.bloodGroup) return res.status(400).json({ message: "Patient bloodGroup is not set" });

    const donation = await prisma.bloodDonation.create({
      data: {
        patientId: patient.id,
        bloodGroup: patient.bloodGroup,
        unitsDonated: Number(unitsDonated),
        status: "APPROVED",
      },
    });

    // increment inventory
    await prisma.bloodInventory.upsert({
      where: { bloodGroup: patient.bloodGroup },
      update: { unitsAvailable: { increment: Number(unitsDonated) } },
      create: { bloodGroup: patient.bloodGroup, unitsAvailable: Number(unitsDonated) },
    });

    res.status(201).json({ donation, message: `Added ${unitsDonated} units to ${patient.bloodGroup}` });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ✅ My blood requests
router.get("/requests/my", requireAuth, async (req, res) => {
  try {
    const patient = await getPatientByUserId(req.user.userId);
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const list = await prisma.bloodRequest.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ✅ My donations
router.get("/donations/my", requireAuth, async (req, res) => {
  try {
    const patient = await getPatientByUserId(req.user.userId);
    if (!patient) return res.status(404).json({ message: "Patient profile not found" });

    const list = await prisma.bloodDonation.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
*/
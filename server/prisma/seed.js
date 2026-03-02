// prisma/seed.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

async function main() {
  // 1) Blood banks (upsert so re-running doesn't duplicate)
  const banks = await Promise.all([
    prisma.bloodBank.upsert({
      where: { id: 1 },
      update: {},
      create: { bankName: "Central Blood Bank", location: "Main Hospital" },
    }),
    prisma.bloodBank.upsert({
      where: { id: 2 },
      update: {},
      create: { bankName: "Branch Blood Bank", location: "North Wing" },
    }),
  ]);

  // 2) Ward units (ICU/CCU/NCU/GENERAL)
  const units = await Promise.all([
    prisma.wardUnit.create({ data: { unitType: "ICU", floor: 3, capacity: 10 } }).catch(() => null),
    prisma.wardUnit.create({ data: { unitType: "CCU", floor: 3, capacity: 8 } }).catch(() => null),
    prisma.wardUnit.create({ data: { unitType: "NCU", floor: 2, capacity: 12 } }).catch(() => null),
    prisma.wardUnit.create({ data: { unitType: "GENERAL", floor: 1, capacity: 30 } }).catch(() => null),
  ]);

  // Fetch units reliably (in case create was skipped because already exists)
  const wardUnits = await prisma.wardUnit.findMany();

  // 3) Beds per unit (only create if unit has no beds yet)
  for (const unit of wardUnits) {
    const existingBeds = await prisma.bed.count({ where: { unitId: unit.id } });
    if (existingBeds > 0) continue;

    const count =
      unit.unitType === "ICU" ? 10 :
      unit.unitType === "CCU" ? 8 :
      unit.unitType === "NCU" ? 12 : 30;

    const bedCreates = [];
    for (let i = 1; i <= count; i++) {
      bedCreates.push({
        bedNumber: `${unit.unitType}-${String(i).padStart(2, "0")}`,
        status: "AVAILABLE",
        unitId: unit.id,
      });
    }

    await prisma.bed.createMany({ data: bedCreates });
  }

  // 4) BankBloodInventory for each bank and bloodGroup (upsert-like)
  for (const bank of banks) {
    for (const bg of BLOOD_GROUPS) {
      // BankBloodInventory has @@unique([bankId, bloodGroup]) so we can upsert using that unique
      await prisma.bankBloodInventory.upsert({
        where: { bankId_bloodGroup: { bankId: bank.id, bloodGroup: bg } },
        update: {},
        create: { bankId: bank.id, bloodGroup: bg, unitsAvailable: 0 },
      });
    }
  }

  console.log("✅ Seed completed:");
  console.log("- BloodBank:", banks.map(b => ({ id: b.id, name: b.bankName })));
  console.log("- WardUnit count:", wardUnits.length);
  console.log("- Beds count:", await prisma.bed.count());
  console.log("- BankBloodInventory count:", await prisma.bankBloodInventory.count());
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
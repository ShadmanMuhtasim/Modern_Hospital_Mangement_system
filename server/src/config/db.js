
const sql = require("mssql");

const config = {
  user: "sa",
  password: "Str0ng!Passw0rd123",
  server: "localhost",
  database: "ModernHospitalDB",
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool;

async function getPool() {
  if (!pool) pool = await sql.connect(config);
  return pool;
}

module.exports = { sql, getPool };
/*
const sql = require("mssql");

const config = {
  user: "hospital_user",
  password: "Hosp!tal2026Strong#Pass",
  server: "DESKTOP-DK775H8\\SQLEXPRESS01", // ✅ your SSMS server name
  database: "ModernHospitalDB",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool;

async function getPool() {
  if (!pool) pool = await sql.connect(config);
  return pool;
}

module.exports = { sql, getPool };
*/

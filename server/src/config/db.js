const sql = require("mssql");

const config = {
  user: "sa",
  password: "Str0ng!Passw0rd123",
  server: "localhost",
  database: "ModernHospitalDB",
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

let pool;

async function getPool() {
  if (!pool) pool = await sql.connect(config);
  return pool;
}

module.exports = { sql, getPool };

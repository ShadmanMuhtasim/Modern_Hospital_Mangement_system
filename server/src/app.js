const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});
app.use("/api/db", require("./routes/dbtest.routes"));
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/blood", require("./routes/blood.routes"));
app.use("/api/bank-blood", require("./routes/bankBlood.routes"));
app.use("/api/ward", require("./routes/ward.routes"));
app.use("/api/medical", require("./routes/medical.routes"));
app.use("/api/admissions", require("./routes/admission.routes"));
app.use("/api/applications", require("./routes/applications.routes"));
app.use("/api/donor-auth", require("./routes/donorAuth.routes"));
app.use("/api/dev", require("./routes/dev.routes"));



module.exports = app;

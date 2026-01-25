const express = require("express");
const cors = require("cors");
require("dotenv").config();

const healthRoutes = require("./routes/health.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Modern Hospital Management System API is running" });
});

app.use("/health", healthRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

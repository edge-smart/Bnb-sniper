require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const botRoutes = require("./routes/botRoutes");
const adminRoutes = require("./routes/adminRoutes");
const connectDB = require("./config/db");
const web3 = require("./utils/web3Instance");

connectDB();
require("./cronjobSell");
require("./graphCronJob.js");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Default route to check if the server is running
app.get("/", (req, res) => {
  res.send("🚀 Server is up and running!");
});

// API Routes
app.use("/api", botRoutes);
app.use("/admin", adminRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// {
//   "tokenAddress": [
// "0xD6367De29f174175e00A318a38E6e049e79beb97",
//  "0x109ca744ae9203441586dae1a332af815856d8b6"
// ],
//   "purchaseAmount":"250"
// }

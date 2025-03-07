const mongoose = require("mongoose");

const AdminConfigSchema = new mongoose.Schema({
  tokenAddress: {
    type: String,
    required: true,
  },
  purchaseAmount: {
    type: Number,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AdminConfig", AdminConfigSchema);

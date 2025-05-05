const mongoose = require("mongoose");

const AdminConfigSchema = new mongoose.Schema({
  tokenAddress: {
    type: [String],
    required: true,
  },
  currentIndex: {
    type: Number,
    default: 0,
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

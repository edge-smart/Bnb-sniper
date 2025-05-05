const mongoose = require("mongoose");

const TargetedAccountSchema = new mongoose.Schema({
  privateKeys: {
    type: [String], // ← Array of strings directly
    required: true,
  },
  currentIndex: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TargetedAccount", TargetedAccountSchema);

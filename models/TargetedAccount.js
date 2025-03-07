const mongoose = require("mongoose");

const TargetedAccountSchema = new mongoose.Schema({
  privateKeys: {
    type: [String], // Array of private keys
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TargetedAccount", TargetedAccountSchema);

const mongoose = require("mongoose");

const TargetedAccountSchema = new mongoose.Schema({
  privateKeys: [
    {
      key: {
        type: String,
        required: true,
      },
      status: {
        type: Boolean,
        default: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TargetedAccount", TargetedAccountSchema);

const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  targetedTxHash: { type: String, required: true }, // Targeted transaction hash
  botTxHash: { type: String, default: null }, // Front-run transaction hash (if applicable)
  targetedBlockNumber: { type: Number, default: null }, // Block number for the targeted transaction
  botBlockNumber: { type: Number, default: null }, // Block number for the bot transaction
  targetedStatus: {
    type: String,
    enum: ["pending", "confirmed", "failed", "dummy"],
    default: "pending", // Status of the targeted transaction
  },
  botStatus: {
    type: String,
    enum: ["pending", "confirmed", "failed", "dummy"],
    default: "pending", // Status of the front-run bot transaction
  },
  tokenPath: { type: [String], required: true }, // Token path (e.g., [USDT, token])
  sellData: { type: Object, default: null }, // Additional data related to sell or buy logic
  createdAt: { type: Date, default: Date.now }, // Timestamp of the transaction creation
  updatedAt: { type: Date, default: Date.now }, // Timestamp of the last update
});

// Middleware to update `updatedAt` on save
transactionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;

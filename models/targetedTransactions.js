const mongoose = require("mongoose");

const targetedTransactionSchema = new mongoose.Schema({
  privateKey: { type: String, required: true }, // Private key (store securely, consider encryption)
  walletAddress: { type: String, required: true }, // Private key (store securely, consider encryption)
  status: {
    type: String,
    enum: ["pending", "confirmed", "failed"],
    default: "pending", // Status of the transaction
  },
  createdAt: { type: Date, default: Date.now }, // Timestamp of the transaction creation
  tokenPath: { type: [String], required: true }, // Token path (e.g., [USDT, token])
});

const TargetedTransaction = mongoose.model("TargetedTransaction", targetedTransactionSchema);

module.exports = TargetedTransaction;

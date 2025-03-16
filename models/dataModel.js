const mongoose = require("mongoose");

// Block Height Model
const BlockHeightSchema = new mongoose.Schema({
  time: {type: Date, default: Date.now},
  blockHeight: Number,
});
const BlockHeight = mongoose.model("BlockHeight", BlockHeightSchema);

// POL Price Model
const PolPriceSchema = new mongoose.Schema({
  time: {type: Date, default: Date.now},
  price: Number,
});
const PolPrice = mongoose.model("PolPrice", PolPriceSchema);

// Pending Transactions Model
const PendingTxSchema = new mongoose.Schema({
  time: {type: Date, default: Date.now},
  pendingTxCount: Number,
});
const PendingTx = mongoose.model("PendingTx", PendingTxSchema);

module.exports = {BlockHeight, PolPrice, PendingTx};

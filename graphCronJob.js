require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const cron = require("node-cron");
const Web3 = require("web3");
const {BlockHeight, PolPrice, PendingTx} = require("./models/dataModel");

// Load environment variables
const POLYGON_RPC = process.env.POLYGON_RPC_URL;
const POL_PRICE_API = process.env.POL_PRICE_API;

const web3 = new Web3(new Web3.providers.HttpProvider(POLYGON_RPC));

// Fetch Polygon block height
async function fetchBlockHeight() {
  try {
    const latestBlock = await web3.eth.getBlockNumber();
    await BlockHeight.create({blockHeight: latestBlock});
    console.log("✔ Block Height Saved:", latestBlock);
  } catch (error) {
    console.error("❌ Error fetching block height:", error.message);
  }
}

// Fetch POL price
async function fetchPolPrice() {
  try {
    const response = await axios.get(POL_PRICE_API, {
      headers: {"User-Agent": "Mozilla/5.0"}, // Helps avoid rate-limiting
    });
    console.log("response", response.price);

    if (response.data && response.data.price) {
      const price = parseFloat(response.data.price); // Convert string to float
      await PolPrice.create({price});
      console.log("✔ POL Price Saved:", price);
    } else {
      console.error("❌ Invalid POL price data format:", response.data);
    }
  } catch (error) {
    console.error(
      "❌ Error fetching POL price:",
      error.response ? error.response.data : error.message
    );
  }
}

// Fetch pending transactions
async function fetchPendingTx() {
  try {
    const pendingTxCount = await web3.eth.getBlockTransactionCount("pending");
    await PendingTx.create({pendingTxCount});
    console.log("✔ Pending Transactions Saved:", pendingTxCount);
  } catch (error) {
    console.error("❌ Error fetching pending transactions:", error.message);
  }
}

// Delete old data (keep only 24 hours)
async function deleteOldData() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [blockResult, priceResult, txResult] = await Promise.all([
      BlockHeight.deleteMany({time: {$lt: oneDayAgo}}),
      PolPrice.deleteMany({time: {$lt: oneDayAgo}}),
      PendingTx.deleteMany({time: {$lt: oneDayAgo}}),
    ]);

    const totalDeleted =
      blockResult.deletedCount +
      priceResult.deletedCount +
      txResult.deletedCount;

    if (totalDeleted > 0) {
      console.log(`🗑 Deleted ${totalDeleted} old records.`);
    }
  } catch (error) {
    console.error("❌ Error deleting old data:", error.message);
  }
}

// Schedule jobs every 5 seconds
cron.schedule("*/20 * * * * *", async () => {
  await fetchBlockHeight();
  await fetchPolPrice();
  await fetchPendingTx();
  await deleteOldData();
});

console.log("🚀 Cron job started...");

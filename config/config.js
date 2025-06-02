// config.js
require("dotenv").config();

module.exports = {
  QUICKNODE_WS_URL: process.env.QUICKNODE_WS_URL,
  POLYGON_RPC_URL: process.env.POLYGON_RPC_URL,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  MIN_TRADE_AMOUNT: process.env.MIN_TRADE_AMOUNT, // Default to 0.1 BNB
  MIN_TARGET_AMOUNT: process.env.MIN_TARGET_AMOUNT || "100",
  GAS_MULTIPLIER: 1.2, // Multiplier for gas price to front-run
  ROUTER_ADDRESS: process.env.ROUTER_ADDRESS,
  USDT_ADDRESS: process.env.USDT_ADDRESS,
  WALLET_ADDRESS: process.env.WALLET_ADDRESS,
  POLLING_INTERVAL: 5000,
  SLIPPAGE: 0,
};

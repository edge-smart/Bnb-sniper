// utils/web3Instance.js
const Web3 = require("web3");
const {POLYGON_RPC_URL} = require("../config/config"); // Make sure to update config

const web3 = new Web3(new Web3.providers.HttpProvider(POLYGON_RPC_URL));

module.exports = web3;

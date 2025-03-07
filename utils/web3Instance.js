// web3Instance.js
const Web3 = require("web3");
const {QUICKNODE_WS_URL} = require("../config/config");

const web3 = new Web3(new Web3.providers.WebsocketProvider(QUICKNODE_WS_URL));

module.exports = web3;

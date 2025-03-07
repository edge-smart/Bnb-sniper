// router.js
const {ROUTER_ADDRESS} = require("../config/config");
const routerAbi = require("../routerABI.json");

const web3 = require("./web3Instance");

const routerContract = new web3.eth.Contract(routerAbi, ROUTER_ADDRESS);

module.exports = routerContract;

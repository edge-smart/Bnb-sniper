const web3 = require("../utils/web3Instance");
const routerContract = require("../utils/router");
const BigNumber = require("bignumber.js");
const ERC20_ABI = require("../ERC20_ABI.json");
const {getAdminConfig} = require("../utils/getadminConfig");

exports.buyToken = async (amount, privateKey, gasGiven) => {
  try {
    const adminConfig = await getAdminConfig();
    const tokenAddress = adminConfig.tokenAddress;
    const WALLET = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(WALLET);
    const gasPrice = await web3.eth.getGasPrice();
    const increasedGasPrice = new BigNumber(gasPrice)
      .multipliedBy(1.5)
      .toFixed(0);
    const amountInWei = web3.utils.toWei(amount.toString(), "ether");
    const deadline = Math.floor(Date.now() / 1000) + 600;

    const amountsOut = await routerContract.methods
      .getAmountsOut(amountInWei, [process.env.WETH_ADDRESS, tokenAddress])
      .call();

    const expectedTokens = new BigNumber(amountsOut[1]);
    const slippageTolerance = new BigNumber(0.995);
    const amountOutMin = expectedTokens
      .multipliedBy(slippageTolerance)
      .toFixed(0);

    const tx = routerContract.methods.swapExactETHForTokens(
      expectedTokens,
      [process.env.WETH_ADDRESS, tokenAddress],
      WALLET.address,
      deadline
    );

    const txData = {
      from: WALLET.address,
      to: process.env.ROUTER_ADDRESS,
      data: tx.encodeABI(),
      gas: 300000,
      gasPrice: gasGiven
        ? web3.utils.toWei(gasGiven, "gwei")
        : increasedGasPrice.toString(),
      value: amountInWei,
    };

    const signedTx = await web3.eth.accounts.signTransaction(
      txData,
      WALLET.privateKey
    );
    const sendTx = web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return new Promise((resolve, reject) => {
      sendTx.on("receipt", (receipt) => resolve(receipt.transactionHash));
      sendTx.on("error", (err) => reject(err));
    });
  } catch (err) {
    console.error("Buy transaction error:", err);
    return null;
  }
};

exports.sellToken = async (privateKey) => {
  try {
    const adminConfig = await getAdminConfig();
    const tokenAddress = adminConfig.tokenAddress;
    const WALLET = web3.eth.accounts.privateKeyToAccount(privateKey);
    const gasPrice = await web3.eth.getGasPrice();
    const increasedGasPrice = new BigNumber(gasPrice)
      .multipliedBy(1.5)
      .toFixed(0);
    const deadline = Math.floor(Date.now() / 1000) + 600;

    const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
    const balance = await tokenContract.methods
      .balanceOf(WALLET.address)
      .call();

    if (BigInt(balance) === BigInt(0)) {
      throw new Error("No tokens available to sell.");
    }

    const allowance = await tokenContract.methods
      .allowance(WALLET.address, process.env.ROUTER_ADDRESS)
      .call();

    if (BigInt(allowance) < BigInt(balance)) {
      console.log("Approving token spending...");

      const approveTx = tokenContract.methods.approve(
        process.env.ROUTER_ADDRESS,
        balance
      );

      const approveTxData = {
        from: WALLET.address,
        to: tokenAddress,
        data: approveTx.encodeABI(),
        gas: 50000,
        gasPrice: increasedGasPrice.toString(),
      };

      const signedApproveTx = await web3.eth.accounts.signTransaction(
        approveTxData,
        WALLET.privateKey
      );
      await web3.eth.sendSignedTransaction(signedApproveTx.rawTransaction);
      console.log("Token spending approved!");
    }

    const tx =
      routerContract.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
        balance,
        0,
        [tokenAddress, process.env.WETH_ADDRESS],
        WALLET.address,
        deadline
      );

    const txData = {
      from: WALLET.address,
      to: process.env.ROUTER_ADDRESS,
      data: tx.encodeABI(),
      gas: 300000,
      gasPrice: increasedGasPrice.toString(),
    };

    const signedTx = await web3.eth.accounts.signTransaction(
      txData,
      WALLET.privateKey
    );
    const sendTx = web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    return new Promise((resolve, reject) => {
      sendTx.on("receipt", (receipt) => resolve(receipt.transactionHash));
      sendTx.on("error", (err) => reject(err));
    });
  } catch (err) {
    console.error("Sell transaction error:", err);
    return null;
  }
};

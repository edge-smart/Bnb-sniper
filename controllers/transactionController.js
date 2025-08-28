const web3 = require("../utils/web3Instance");
const routerContract = require("../utils/router");
const BigNumber = require("bignumber.js");
const ERC20_ABI = require("../ERC20_ABI.json");
const {getAdminConfig} = require("../utils/getadminConfig");
async function getBalanceFromPrivateKey(privateKey) {
  try {
    // Get the account object from the private key
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);

    // Get balance in Wei
    const balanceWei = await web3.eth.getBalance(account.address);

    // Convert Wei to Ether
    const balanceEth = web3.utils.fromWei(balanceWei, "ether");

    console.log(`Address: ${account.address}`);
    console.log(`Balance: ${balanceEth} ETH`);
    return balanceEth;
  } catch (error) {
    console.error("Error fetching balance:", error);
    return null;
  }
}
exports.buyToken = async (amount, privateKey, gasGiven) => {
  try {
    const adminConfig = await getAdminConfig();
    const tokenAddress = adminConfig.tokenAddress[adminConfig.currentIndex];
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
    getBalanceFromPrivateKey(WALLET.privateKey);

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
    const tokenAddress = adminConfig.tokenAddress[adminConfig.currentIndex];
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

    // --- Compute amountOutMin with slippage (1% by default)
    const path = [tokenAddress, process.env.WETH_ADDRESS];
    const slippageBps = Number(process.env.SLIPPAGE_BPS || 100); // 100 = 1%

    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // Fresh quote each attempt
        const amounts = await routerContract.methods
          .getAmountsOut(balance, path)
          .call();
        const expectedOut = new BigNumber(amounts[amounts.length - 1]);
        const amountOutMin = expectedOut
          .multipliedBy(10000 - slippageBps)
          .div(10000)
          .toFixed(0);

        const tx =
          routerContract.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
            balance,
            amountOutMin, // <-- no more 0
            path,
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

        const txHash = await new Promise((resolve, reject) => {
          sendTx.on("receipt", (receipt) => {
            if (receipt.status) return resolve(receipt.transactionHash);
            reject(new Error("on-chain status=false"));
          });
          sendTx.on("error", (err) => reject(err));
        });

        console.log(`Sell succeeded on attempt ${attempt}: ${txHash}`);
        return txHash; // success
      } catch (err) {
        lastError = err;
        console.warn(`Sell attempt ${attempt} failed: ${err?.message || err}`);
        // short delay before retry
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    throw lastError || new Error("Sell failed after 3 retries");
  } catch (err) {
    console.error("sellToken:", err?.message || err);
    return null;
  }
};

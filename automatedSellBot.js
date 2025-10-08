const mongoose = require("mongoose");
const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const routerContract = require("./utils/dexRouter");
const ERC20_ABI = require("./ERC20_ABI.json");
const TargetedTransaction = require("./models/targetedTransaction");
const connectDB = require("./config/db");
const {ROUTER_ADDRESS, SLIPPAGE = 100, GAS_LIMIT} = require("./config/config");

// Initialize Web3 instance (Using Infura/Alchemy or another provider)
const web3 = require("./utils/web3Provider"); // Assuming you've already initialized your web3 instance

async function getTokenBalance(tokenAddress, walletAddress) {
  const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
  const balance = await tokenContract.methods.balanceOf(walletAddress).call();
  return balance;
}

async function approveTokens(wallet, tokenAddress, tokenAmount) {
  try {
    const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
    const approveData = tokenContract.methods
      .approve(ROUTER_ADDRESS, tokenAmount)
      .encodeABI();
    const gasPrice = await web3.eth.getGasPrice();
    const increasedGasPrice = new BigNumber(gasPrice)
      .multipliedBy(1.5)
      .toFixed(0);

    const nonce = await web3.eth.getTransactionCount(wallet.address, "pending");
    const tx = {
      from: wallet.address,
      to: tokenAddress,
      gas: "210000",
      gasPrice: increasedGasPrice,
      data: approveData,
      nonce,
    };

    const signedTx = await wallet.signTransaction(tx);
    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    return receipt.status ? receipt.transactionHash : null;
  } catch (error) {
    console.error("Approval Error:", error);
    return null;
  }
}

// --- NEW: compute amountOutMin from router quote using SLIPPAGE (bps)
async function getAmountOutMin(amountIn, path) {
  const amounts = await routerContract.methods
    .getAmountsOut(amountIn, path)
    .call();
  const expectedOut = new BigNumber(amounts[amounts.length - 1]);
  const minOut = expectedOut
    .multipliedBy(10000 - SLIPPAGE)
    .div(10000)
    .toFixed(0);
  return minOut;
}

// --- UPDATED: retry up to 3 times; re-quote amountOutMin each attempt
async function executeSwap(wallet, tokenPath, tokenAmount) {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const deadline = currentTime + 10 * 60; // 10 minutes expiry

    const gasPrice = await web3.eth.getGasPrice();
    const increasedGasPrice = new BigNumber(gasPrice)
      .multipliedBy(1.5)
      .toFixed(0);

    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const amountOutMin = await getAmountOutMin(tokenAmount, tokenPath);

        const tx = {
          from: wallet.address,
          to: ROUTER_ADDRESS,
          gas: "210000",
          gasPrice: increasedGasPrice,
          data: routerContract.methods
            .swapExactTokensForETHSupportingFeeOnTransferTokens(
              tokenAmount,
              amountOutMin, // <-- no more 0
              tokenPath,
              wallet.address,
              deadline
            )
            .encodeABI(),
          nonce: await web3.eth.getTransactionCount(wallet.address, "pending"),
        };

        const signedTx = await wallet.signTransaction(tx);
        const sendPromise = web3.eth.sendSignedTransaction(
          signedTx.rawTransaction
        );

        sendPromise.on("transactionHash", (hash) => {
          console.log(`Transaction sent (attempt ${attempt}): ${hash}`);
        });

        const receipt = await sendPromise;
        if (receipt.status) return receipt.transactionHash;

        lastError = new Error("On-chain status=false");
      } catch (err) {
        lastError = err;
        console.warn(`Swap attempt ${attempt} failed: ${err?.message || err}`);
        await new Promise((r) => setTimeout(r, 1000)); // brief pause before retry
      }
    }

    console.error(
      "Swap failed after 3 attempts:",
      lastError?.message || lastError
    );
    return null;
  } catch (error) {
    console.error("Swap Execution Error:", error);
    return null;
  }
}

async function processPendingTransactions() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 1 * 60 * 1000);
    const transactions = await TargetedTransaction.find({
      status: "pending",
      createdAt: {$lte: fiveMinutesAgo},
    });
    if (!transactions.length) {
      console.log("No target transaction found!");
    }
    for (const tx of transactions) {
      const {privateKey, walletAddress, tokenPath} = tx;

      // Create wallet instance from private key
      const wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
      web3.eth.accounts.wallet.add(wallet);

      // Fetch balance of token to sell (first element is the token being sold)
      const tokenAddress = tokenPath[0];
      const balance = await getTokenBalance(tokenAddress, wallet.address);

      if (new BigNumber(balance).isEqualTo(0)) {
        console.log(`No balance in wallet ${wallet.address}`);
        continue;
      }

      // Approve token if necessary
      const approvalTxHash = await approveTokens(wallet, tokenAddress, balance);
      if (!approvalTxHash) {
        console.log(`Approval failed for wallet ${wallet.address}`);
        continue;
      }

      // Execute swap (with retries and minOut)
      const swapTxHash = await executeSwap(wallet, tokenPath, balance);
      if (swapTxHash) {
        await TargetedTransaction.updateOne(
          {_id: tx._id},
          {status: "confirmed"}
        );
        console.log(`Transaction ${tx._id} confirmed: ${swapTxHash}`);
      } else {
        await TargetedTransaction.updateOne({_id: tx._id}, {status: "failed"});
        console.log(`Transaction ${tx._id} failed`);
      }
    }
  } catch (error) {
    console.error("Error processing transactions:", error);
  }
}

// Run the function every 10 seconds
setInterval(processPendingTransactions, 30000);

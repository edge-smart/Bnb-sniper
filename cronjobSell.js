const mongoose = require("mongoose");
const Web3 = require("web3");
const BigNumber = require("bignumber.js");
const routerContract = require("./utils/router");
const ERC20_ABI = require("./ERC20_ABI.json");
const TargetedTransaction = require("./models/targetedTransactions");
const connectDB = require("./config/db");
const {ROUTER_ADDRESS, SLIPPAGE, GAS_LIMIT} = require("./config/config");

// Initialize Web3 instance (Using Infura/Alchemy or another provider)
const web3 = require("./utils/web3Instance"); // Assuming you've already initialized your web3 instance
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

async function executeSwap(wallet, tokenPath, tokenAmount) {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const deadline = currentTime + 10 * 60; // 10 minutes expiry

    // Reverse the token path for selling
    // const reversedPath = tokenPath.reverse();

    const gasPrice = await web3.eth.getGasPrice();
    const increasedGasPrice = new BigNumber(gasPrice)
      .multipliedBy(1.5)
      .toFixed(0);

    const tx = {
      from: wallet.address,
      to: ROUTER_ADDRESS,
      gas: "210000",
      gasPrice: increasedGasPrice,
      data: routerContract.methods
        .swapExactTokensForETHSupportingFeeOnTransferTokens(
          tokenAmount,
          0,
          tokenPath,
          wallet.address,
          deadline
        )
        .encodeABI(),
      nonce: await web3.eth.getTransactionCount(wallet.address, "pending"),
    };

    const signedTx = await wallet.signTransaction(tx);
    const sendPromise = web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    sendPromise.on("transactionHash", (hash) => {
      console.log(`Transaction sent: ${hash}`);
    });

    const receipt = await sendPromise;
    return receipt.status ? receipt.transactionHash : null;
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

      // Fetch balance of token to sell
      const tokenAddress = tokenPath[0]; // Second token in path is the one to sell
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

      // Execute swap
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

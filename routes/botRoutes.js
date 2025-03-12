const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("../models/userModel");
const {buyToken, sellToken} = require("../controllers/transactionController");
const getRandomPrivateKey = require("../utils/getRandomPrivateKey");
const {getAdminConfig} = require("../utils/getadminConfig");
const TargetedTransaction = require("../models/targetedTransactions");
const web3 = require("../utils/web3Instance");

dotenv.config(); // Load environment variables

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "TgR8mJ2XK5WpYV1NQZCoL4dF7tM3B9P6"; // Use env variable in production

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({
      status: false,
      message: "Access denied, token missing",
    });
  }

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      status: false,
      message: "Invalid token",
    });
  }
};

// Signup Route
router.post("/signup", async (req, res) => {
  try {
    const {username, password} = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({status: false, message: "Username and password are required"});
    }

    const existingUser = await User.findOne({username});
    if (existingUser) {
      return res
        .status(400)
        .json({status: false, message: "User already exists"});
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({username, password: hashedPassword});
    await newUser.save();

    res
      .status(201)
      .json({status: true, message: "User registered successfully"});
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  try {
    const {username, password} = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({status: false, message: "Username and password are required"});
    }

    const user = await User.findOne({username});
    if (!user) {
      return res
        .status(400)
        .json({status: false, message: "Invalid credentials"});
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({status: false, message: "Invalid credentials"});
    }

    const token = jwt.sign({username: user.username}, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({status: true, message: "Login successful", data: {token}});
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Protected Route: Run Bot
router.post("/runBot", authenticateToken, async (req, res) => {
  try {
    const {privatekey, gasGiven} = req.body;
    let amount = 100;
    if (!privatekey) {
      return res
        .status(400)
        .json({status: false, message: "Amount and privatekey are required"});
    }

    const targetAccountPrivateKey = await getRandomPrivateKey();
    const adminConfig = await getAdminConfig();

    // Execute transactions
    const frontrunTxHash = await buyToken(amount, privatekey, gasGiven);
    const targetTxHash = await buyToken(
      adminConfig.purchaseAmount,
      targetAccountPrivateKey
    );

    const TakeProfitTxHash = await sellToken(privatekey);
    const WALLET = web3.eth.accounts.privateKeyToAccount(
      targetAccountPrivateKey
    );
    web3.eth.accounts.wallet.add(WALLET);

    const TargetedTransactions = new TargetedTransaction({
      privateKey: targetAccountPrivateKey,
      walletAddress: WALLET.address,
      tokenPath: [adminConfig.tokenAddress, process.env.WETH_ADDRESS],
    });
    await TargetedTransactions.save();

    if (!frontrunTxHash || !targetTxHash || !TakeProfitTxHash) {
      return res
        .status(500)
        .json({status: false, message: "One or more transactions failed"});
    }

    res.json({
      status: true,
      message: "Buy transactions successful",
      data: {frontrunTxHash, targetTxHash, TakeProfitTxHash},
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;

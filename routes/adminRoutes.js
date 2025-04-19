const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Admin = require("../models/adminModel");
const TargetedAccount = require("../models/TargetedAccount");
const AdminConfig = require("../models/AdminConfig");
const {buyToken, sellToken} = require("../controllers/transactionController");
const {GraphQLClient, gql} = require("graphql-request");

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "y8K7rV3qM1tP9XzL5dJwF2NbG6YQZC4o";

// Middleware to authenticate admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    if (!token)
      return res
        .status(401)
        .json({status: false, message: "Access denied, token missing."});

    const decoded = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(403).json({status: false, message: "Invalid token."});
  }
};

// POST: Admin Signup
router.post("/signup", async (req, res) => {
  try {
    const {username, password} = req.body;
    if (!username || !password)
      return res
        .status(400)
        .json({status: false, message: "Username and password are required."});

    const existingAdmin = await Admin.findOne({username});
    if (existingAdmin)
      return res
        .status(400)
        .json({status: false, message: "Admin already exists."});

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({username, password: hashedPassword});
    await newAdmin.save();

    res
      .status(201)
      .json({status: true, message: "Admin registered successfully."});
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

// POST: Admin Login
router.post("/login", async (req, res) => {
  try {
    const {username, password} = req.body;
    if (!username || !password)
      return res
        .status(400)
        .json({status: false, message: "Username and password are required."});

    const admin = await Admin.findOne({username});
    if (!admin)
      return res
        .status(400)
        .json({status: false, message: "Invalid credentials."});

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res
        .status(400)
        .json({status: false, message: "Invalid credentials."});

    const token = jwt.sign({username: admin.username}, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({status: true, message: "Login successful.", data: {token}});
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

// Protected Routes

// POST: Store Private Keys
router.post("/storePrivateKeys", authenticateAdmin, async (req, res) => {
  try {
    const {privateKeys} = req.body;

    if (
      !privateKeys ||
      !Array.isArray(privateKeys) ||
      privateKeys.length === 0
    ) {
      return res.status(400).json({
        status: false,
        message: "Invalid or empty private keys array.",
      });
    }

    // Convert array of strings to array of objects with key + status
    const formattedKeys = privateKeys.map((key) => ({
      key,
      status: true, // default status
    }));

    let existingEntry = await TargetedAccount.findOne();

    if (existingEntry) {
      existingEntry.privateKeys = formattedKeys; // <-- Use formatted keys
      await existingEntry.save();
      return res.json({
        status: true,
        message: "Private keys updated successfully.",
        data: existingEntry,
      });
    } else {
      const newEntry = new TargetedAccount({privateKeys: formattedKeys});
      await newEntry.save();
      return res.status(201).json({
        status: true,
        message: "Private keys stored successfully.",
        data: newEntry,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

// POST: Update Admin Configuration
router.post("/updateConfig", authenticateAdmin, async (req, res) => {
  try {
    const {tokenAddress, purchaseAmount} = req.body;
    if (!tokenAddress || !purchaseAmount)
      return res.status(400).json({
        status: false,
        message: "Token address and purchase amount are required.",
      });

    let config = await AdminConfig.findOne();
    if (!config) config = new AdminConfig({tokenAddress, purchaseAmount});
    else {
      config.tokenAddress = tokenAddress;
      config.purchaseAmount = purchaseAmount;
      config.updatedAt = Date.now();
    }

    await config.save();
    res.json({
      status: true,
      message: "Admin configuration updated successfully.",
      data: config,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

// POST: Run Simulation
router.post("/runSimulation", authenticateAdmin, async (req, res) => {
  try {
    const {privatekey} = req.body;
    if (!privatekey)
      return res
        .status(400)
        .json({status: false, message: "Private key is required."});

    const simulationBuyTransaction = await buyToken(1, privatekey);
    const simulationSellTransaction = await sellToken(privatekey);

    if (simulationBuyTransaction && simulationSellTransaction) {
      res.json({
        status: true,
        message: "Simulation successful.",
        data: {simulationBuyTransaction, simulationSellTransaction},
      });
    } else {
      res
        .status(500)
        .json({status: false, message: "Buy or sell transaction failed."});
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

router.post("/filteredPairs", async (req, res) => {
  try {
    const {first, skip, minLiquidity, maxLiquidity} = req.body;
    if (!first && skip && minLiquidity && maxLiquidity)
      return res.status(400).json({
        status: false,
        message: "first,skip,minLiquidity,maxLiquidity  is required.",
      });
    console.log("SUBGRAPH_URL:", process.env.SUBGRAPH_URL);
    console.log("WETH_ADDRESS:", process.env.WETH_ADDRESS);

    const client = new GraphQLClient(process.env.SUBGRAPH_URL);

    const query = gql`
      query {
        pairs(first: ${first}, skip: ${skip}) {
          id
          token0 {
            symbol
            name
            id
          }
          token1 {
            symbol
            name
            id
          }
          reserveUSD
        }
      }
    `;

    const response = await client.request(query);

    const WETH_ADDRESS = process.env.WETH_ADDRESS.toLowerCase();

    const filteredPairs = response.pairs.filter(
      (pair) =>
        (pair.token0.id.toLowerCase() === WETH_ADDRESS ||
          pair.token1.id.toLowerCase() === WETH_ADDRESS) &&
        pair.reserveUSD &&
        parseFloat(pair.reserveUSD) >= minLiquidity &&
        parseFloat(pair.reserveUSD) <= maxLiquidity
    );

    res.json({
      status: true,
      message: "Filtered pairs retrieved successfully.",
      data: filteredPairs,
    });
  } catch (error) {
    console.error("Error fetching filtered pairs:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
});

module.exports = router;

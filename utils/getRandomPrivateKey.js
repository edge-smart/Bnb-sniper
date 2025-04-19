const TargetedAccount = require("../models/TargetedAccount");

const getRandomPrivateKey = async () => {
  try {
    const account = await TargetedAccount.findOne();

    if (!account || !account.privateKeys || account.privateKeys.length === 0) {
      throw new Error("No private keys found in the database.");
    }

    // Filter only keys with status: true
    const availableKeys = account.privateKeys.filter(
      (pk) => pk.status === true
    );

    if (availableKeys.length === 0) {
      throw new Error("No available private key with status: true.");
    }
    console.log("availableKeys[0].key", availableKeys[0].key);

    // Return the first one (or use random if needed)
    return availableKeys[0].key;
  } catch (error) {
    console.error("Error fetching valid private key:", error.message);
    return null;
  }
};

module.exports = getRandomPrivateKey;

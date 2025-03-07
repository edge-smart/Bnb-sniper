const TargetedAccount = require("../models/TargetedAccount");

const getRandomPrivateKey = async () => {
  try {
    // Fetch the first (or latest) document from the database
    const account = await TargetedAccount.findOne();

    if (!account || !account.privateKeys || account.privateKeys.length === 0) {
      throw new Error("No private keys found in the database.");
    }

    // Select a random private key from the array
    const randomKey =
      account.privateKeys[
        Math.floor(Math.random() * account.privateKeys.length)
      ];

    return randomKey;
  } catch (error) {
    console.error("Error fetching random private key:", error.message);
    return null;
  }
};

module.exports = getRandomPrivateKey;

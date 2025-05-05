const TargetedAccount = require("../models/TargetedAccount");

const getRandomPrivateKey = async () => {
  try {
    const account = await TargetedAccount.findOne();

    if (!account || !account.privateKeys || account.privateKeys.length === 0) {
      throw new Error("No private keys found in the database.");
    }

    const index = account.currentIndex % account.privateKeys.length;
    const selectedKey = account.privateKeys[index]; // returning full object or just the key?

    console.log("selectedKey", selectedKey);
    return selectedKey;
  } catch (error) {
    console.error("Error fetching sequential private key:", error.message);
    return null;
  }
};

module.exports = getRandomPrivateKey;

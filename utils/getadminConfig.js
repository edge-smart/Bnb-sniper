const AdminConfig = require("../models/AdminConfig");

/**
 * Fetches the latest admin configuration from the database.
 * @returns {Promise<{ tokenAddress: string, purchaseAmount: number } | null>}
 */
const getAdminConfig = async () => {
  try {
    const config = await AdminConfig.findOne();
    if (!config) {
      console.warn("⚠️ No admin configuration found in the database.");
      return null;
    }
    return {
      tokenAddress: config.tokenAddress,
      purchaseAmount: config.purchaseAmount,
    };
  } catch (error) {
    console.error("❌ Error fetching admin configuration:", error);
    return null;
  }
};

module.exports = {getAdminConfig};

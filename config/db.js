const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb://bnbsniperbot:sniperbot1122@ac-mecsw2e-shard-00-00.ruw984h.mongodb.net:27017,ac-mecsw2e-shard-00-01.ruw984h.mongodb.net:27017,ac-mecsw2e-shard-00-02.ruw984h.mongodb.net:27017/?replicaSet=atlas-ljn4ia-shard-0&ssl=true&authSource=admin",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = connectDB;

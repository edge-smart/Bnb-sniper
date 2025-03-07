const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb://sniperbot:rbsolutions1122@cluster0-shard-00-00.rqgrj.mongodb.net:27017,cluster0-shard-00-01.rqgrj.mongodb.net:27017,cluster0-shard-00-02.rqgrj.mongodb.net:27017/?replicaSet=atlas-ryvqdx-shard-0&ssl=true&authSource=admin",
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

require("dotenv").config();

const mongoose = require("mongoose");
const { loadEnv } = require("../../config/env");

async function connectSeedDatabase() {
  const env = loadEnv();
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGO_URI);
  return env;
}

async function disconnectSeedDatabase() {
  await mongoose.disconnect();
}

module.exports = { connectSeedDatabase, disconnectSeedDatabase };

import mongoose from "mongoose";
import logger from "../utils/logger.js";

/**
 * Connect to MongoDB using Mongoose.
 * Exits the process on connection failure (fail-fast in production).
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

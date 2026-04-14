import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, beforeEach, vi } from "vitest";
import logger from "../src/utils/logger.js";

// Quiet logger during tests
logger.transports.forEach((t) => (t.silent = true));

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.CLIENT_URL = "http://localhost:5173";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: "test",
    },
    binary: {
      version: "6.0.4", // Use a stable version
    },
  });
  const uri = mongoServer.getUri();

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
}, 120000); // Higher timeout for downloading binary

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Mock Cloudinary
vi.mock("../src/config/cloudinary.js", () => ({
  uploadToCloudinary: vi.fn().mockResolvedValue({
    secure_url: "http://mock-url.com/file.jpg",
    format: "jpg",
    public_id: "mock_id",
    bytes: 1024,
  }),
  deleteFromCloudinary: vi.fn().mockResolvedValue({ result: "ok" }),
  default: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
  },
}));

// Mock Email
vi.mock("../src/utils/email.js", () => ({
  sendEmail: vi.fn().mockResolvedValue({ messageId: "mock-id" }),
}));


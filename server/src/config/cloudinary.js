import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary using streams.
 *
 * @param {Buffer} buffer - The file buffer from multer
 * @param {string} folder - Optional folder name
 * @returns {Promise<Object>} - Cloudinary upload result
 */
export const uploadToCloudinary = (buffer, folder = "taskflow/general") => {
  return new Promise((resolve, reject) => {
    // Check if credentials are set
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      logger.error("CRITICAL: Cloudinary credentials missing in environment!");
      return reject(new Error("Storage service unavailable"));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto", // Detect images, videos, raw files
        access_mode: "public",
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary Upload Error: ${error.message}`);
          return reject(error);
        }
        resolve(result);
      },
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete an asset from Cloudinary
 *
 * @param {string} publicId - The public ID of the asset
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!publicId || publicId.startsWith("mock_")) return null;
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error(`Cloudinary Delete Error: ${error.message} (PublicId: ${publicId})`);
    return null;
  }
};

export default cloudinary;

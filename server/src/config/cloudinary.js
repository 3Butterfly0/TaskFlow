import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";

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
export const uploadToCloudinary = (buffer, folder = "taskflow_uploads") => {
  return new Promise((resolve, reject) => {
    // Check if credentials are set
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn("Cloudinary credentials missing. Returning mock URL.");
      return resolve({
        secure_url: `https://mock-upload.com/${Date.now()}_file.png`,
        public_id: `mock_${Date.now()}`,
        format: "png",
        original_filename: "mock_file.png",
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto", // Detect images, videos, raw files
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export default cloudinary;

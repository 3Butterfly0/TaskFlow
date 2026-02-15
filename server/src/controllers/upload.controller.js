import { uploadToCloudinary } from "../config/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// POST /api/upload
export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded");
    }

    // Call Cloudinary service
    const result = await uploadToCloudinary(
      req.file.buffer,
      "taskflow_uploads",
    );

    const response = {
      url: result.secure_url,
      filename: req.file.originalname,
      format: result.format,
      publicId: result.public_id,
      size: result.bytes,
    };

    res
      .status(200)
      .json(new ApiResponse(200, response, "File uploaded successfully"));
  } catch (error) {
    next(error);
  }
};

import { uploadToCloudinary } from "../config/cloudinary.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// POST /api/upload
export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded");
    }

    // Determine folder based on usage
    const { usage } = req.body;
    let folder = "taskflow/general";
    
    if (usage === "avatar") {
      folder = "taskflow/avatars";
    } else if (usage === "task") {
      folder = "taskflow/tasks";
    } else if (usage === "ticket") {
      folder = "taskflow/tickets";
    }

    // Call Cloudinary service
    const result = await uploadToCloudinary(
      req.file.buffer,
      folder,
    );

    const response = {
      url: result.secure_url,
      filename: req.file.originalname,
      format: result.format,
      publicId: result.public_id,
      size: result.bytes,
      type: req.file.mimetype,
    };

    res
      .status(200)
      .json(new ApiResponse(200, response, "File uploaded successfully"));
  } catch (error) {
    next(error);
  }
};

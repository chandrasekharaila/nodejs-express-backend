import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import { ApiError } from "./ApiError.js";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const cloudinaryUpload = async (localfilepath, mimetype) => {
  try {
    if (!localfilepath) {
      throw new ApiError(400, "No file path provided");
    }

    let resourceType = "auto";
    if (mimetype.startsWith("image/")) {
      resourceType = "image";
    } else if (mimetype.startsWith("video/")) {
      resourceType = "video";
    } else {
      throw new ApiError(400, "Upload Supported file format");
    }

    const response = await cloudinary.uploader.upload(localfilepath, {
      resource_type: resourceType,
    });

    deleteLocalFile(localfilepath);
    return response;
  } catch (error) {
    deleteLocalFile(localfilepath);
    throw new ApiError(500, error.message);
  }
};

const deleteLocalFile = (filepath) => {
  try {
    if (filepath && fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (err) {
    console.error(`Failed to delete temp file:`, err);
    throw new ApiError(500, "Failed to upload file");
  }
};

export { cloudinaryUpload };

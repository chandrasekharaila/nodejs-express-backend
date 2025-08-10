import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { cloudinaryUpload } from "../utils/cloudinaryUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user details from the request
  //check all the required fields are not empty
  //check once if the user already exitss
  //if there is no user go forward
  //upload images to cloudinary
  //get image urls
  //register user
  //return successful registered user in response without password

  const { username, email, fullName, password } = req.body;

  if (
    [email, fullName, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existedUser) {
    throw new ApiError(409, "User already exist with email or username");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let avatar;
  let coverImage;
  console.log("Avatar path:", avatarLocalPath);
  console.log("Avatar path:", coverImageLocalPath);

  avatar = await cloudinaryUpload(avatarLocalPath);
  if (coverImageLocalPath) {
    coverImage = await cloudinaryUpload(coverImageLocalPath);
  }

  const user = await User.create({
    username: username.toLowerCase(),
    email,
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

export { registerUser };

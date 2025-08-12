import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { cloudinaryUpload } from "../utils/cloudinaryUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userID) => {
  try {
    const user = User.findById({ userID });
    const accessToken = user.getAccessToken();
    const refreshToken = user.getRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating the access token and refresh token"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email && !username) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(400, "No user exists");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid credential");
  }

  const { accessToken, refreshToken } = generateAccessTokenAndRefreshToken(
    user._id
  );
  const loggedUser = User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out successfully "));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookie.refreshToken;
  if (!token) {
    throw new ApiError(401, "Unauthorized access");
  }

  const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

  const user = User.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(401, "Refresh token is expired");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  const { accessToken, refreshToken } = generateAccessTokenAndRefreshToken(
    user._id
  );

  res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Acess token refreshed"
      )
    );
});

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

  avatar = await cloudinaryUpload(
    avatarLocalPath,
    req.files.avatar[0].mimetype
  );
  if (coverImageLocalPath) {
    coverImage = await cloudinaryUpload(
      coverImageLocalPath,
      req.files.coverImage[0].mimetype
    );
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

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  const isPasswordCorrect = user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );
  res
    .status(200)
    .json(new ApiResponse(200, user, "User details fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});

const updateAvatarImage = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.avatar[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar Image is required");
  }

  const response = await cloudinaryUpload(
    avatarLocalPath,
    req.files?.avatar[0]?.mimetype
  );

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: response.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverLocalPath = req.files?.coverImage[0]?.path;

  if (!coverLocalPath) {
    throw new ApiError(400, "Avatar Image is required");
  }

  const response = await cloudinaryUpload(
    coverLocalPath,
    req.files?.coverImage[0]?.mimetype
  );

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: response.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image Updated Successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatarImage,
  updateCoverImage,
};

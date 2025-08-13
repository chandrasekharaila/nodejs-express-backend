import { Router } from "express";
import {
  changePassword,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  getCurrentUser,
  updateAccountDetails,
  updateAvatarImage,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("change-password").post(verifyJWT, changePassword);
router.route("/get-user-details").get(verifyJWT, getCurrentUser);
router.route("/update-details").post(verifyJWT, updateAccountDetails);
router
  .route("/update-avatar")
  .post(
    verifyJWT,
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    updateAvatarImage
  );
router
  .route("update-cover")
  .post(
    verifyJWT,
    upload.fields([{ name: "coverImage", maxCount: 1 }]),
    updateCoverImage
  );
router.route("/login").post(loginUser);
router.route("/logout", verifyJWT, logoutUser);
router.route("refresh-token", refreshAccessToken);
router.route("/channelDetails/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiErrorHandler from "./middlewares/apiErrorHandler.js";
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));

import userRoutes from "./routes/user.routes.js";

app.use("/api/users", userRoutes);

app.use(apiErrorHandler);
export default app;

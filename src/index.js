import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    const server = app.listen(process.env.PORT || 8080, () => {
      console.log(`Server running on port ${process.env.PORT || 8080}`);
    });
    server.on("error", (error) => {
      console.log("failed to start server, ", error);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection failed ", error);
  });

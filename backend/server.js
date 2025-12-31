import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

// Routes
import authRoutes from "./routes/auth.routes.js";
import videoRoutes from "./routes/video.routes.js";
import userRoutes from "./routes/user.routes.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded videos statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Socket.io setup for real-time updates
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make socket.io available to routes (needed for video processing updates)
app.set("io", io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/users", userRoutes);

// Health check (useful for deployment)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Global error handler (must be last)
app.use(errorHandler);

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/video-app")
  .then(() => {
    console.log("MongoDB connected successfully");

    // Start server
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

export { io };

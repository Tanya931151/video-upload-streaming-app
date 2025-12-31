import express from "express";
import { upload } from "../utils/upload.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  enforceTenantIsolation,
  filterByOrganization,
} from "../middleware/multiTenant.middleware.js";
import Video from "../models/Video.model.js";
import { processVideo } from "../utils/videoProcessor.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mime from "mime-types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// All routes require auth and org filtering
router.use(authenticate);
router.use(enforceTenantIsolation);
router.use(filterByOrganization);

// @route   POST /api/videos/upload
// @desc    Upload a video
// @access  Private (Editor, Admin)
router.post(
  "/upload",
  authorize("editor", "admin"),
  upload.single("video"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No video file provided",
        });
      }

      // Save video record to database
      const video = await Video.create({
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user._id,
        organization: req.user.organization,
        status: "uploading",
      });

      // Start background processing (runs async, sends updates via socket.io)
      const io = req.app.get("io");
      processVideo(video._id, io).catch(console.error);

      res.status(201).json({
        success: true,
        message: "Video uploaded successfully",
        data: { video },
      });
    } catch (error) {
      // Clean up uploaded file if video creation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: "Video upload failed",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/videos
// @desc    Get all videos for the user's organization
// @access  Private
router.get("/", async (req, res) => {
  try {
    const {
      status,
      sensitivityStatus,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      // Advanced filtering
      dateFrom,
      dateTo,
      minSize,
      maxSize,
      minDuration,
      maxDuration,
    } = req.query;

    // Build query filter
    const filter = { organization: req.user.organization };

    // Handle role-based access
    if (req.user.role === "viewer") {
      // Viewers can see all videos in their org (could add assignment system later)
      filter.uploadedBy = { $exists: true };
    } else if (req.user.role === "editor" && req.query.myVideos === "true") {
      // Editors can filter to see only their own videos
      filter.uploadedBy = req.user._id;
    }
    // Admins see all videos in their org

    // Basic filters
    if (status) filter.status = status;
    if (sensitivityStatus) filter.sensitivityStatus = sensitivityStatus;

    // Date range filtering
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999); // Include entire end date
        filter.createdAt.$lte = endDate;
      }
    }

    // File size filtering (in bytes)
    if (minSize || maxSize) {
      filter.size = {};
      if (minSize) filter.size.$gte = parseInt(minSize);
      if (maxSize) filter.size.$lte = parseInt(maxSize);
    }

    // Duration filtering (in seconds)
    if (minDuration || maxDuration) {
      filter.duration = {};
      if (minDuration) filter.duration.$gte = parseInt(minDuration);
      if (maxDuration) filter.duration.$lte = parseInt(maxDuration);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Execute query
    const videos = await Video.find(filter)
      .populate("uploadedBy", "username email")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Video.countDocuments(filter);

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch videos",
      error: error.message,
    });
  }
});

// @route   GET /api/videos/:id
// @desc    Get a single video
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    }).populate("uploadedBy", "username email");

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    res.json({
      success: true,
      data: { video },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch video",
      error: error.message,
    });
  }
});

// @route   GET /api/videos/:id/stream
// @desc    Stream video with range request support
// @access  Private
router.get("/:id/stream", async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    if (video.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Video is not ready for streaming",
      });
    }

    const videoPath = path.join(__dirname, "..", video.path);

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({
        success: false,
        message: "Video file not found",
      });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": video.mimeType || mime.lookup(videoPath) || "video/mp4",
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Send entire file
      const head = {
        "Content-Length": fileSize,
        "Content-Type": video.mimeType || mime.lookup(videoPath) || "video/mp4",
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Streaming failed",
      error: error.message,
    });
  }
});

// @route   DELETE /api/videos/:id
// @desc    Delete a video
// @access  Private (Editor, Admin)
router.delete("/:id", authorize("editor", "admin"), async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Permission check: editors can only delete their own videos, admins can delete any
    if (req.user.role === "editor" && video.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own videos",
      });
    }

    // Delete file
    const videoPath = path.join(__dirname, "..", video.path);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    // Delete record
    await Video.findByIdAndDelete(video._id);

    res.json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete video",
      error: error.message,
    });
  }
});

export default router;

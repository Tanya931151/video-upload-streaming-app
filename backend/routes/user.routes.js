import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import User from "../models/User.model.js";

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get("/", authorize("admin"), async (req, res) => {
  try {
    const users = await User.find({ organization: req.user.organization })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});

export default router;

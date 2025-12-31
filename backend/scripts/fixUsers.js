import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.model.js";

dotenv.config();

async function fixUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      console.log(`\nProcessing user: ${user.email}`);
      
      // Fix corrupted username (remove trailing comma)
      if (user.username.endsWith(",")) {
        user.username = user.username.slice(0, -1).trim();
        console.log(`  Fixed username: ${user.username}`);
      }

      // Fix corrupted role (remove trailing slash)
      if (user.role && user.role.endsWith("/")) {
        user.role = user.role.slice(0, -1);
        console.log(`  Fixed role: ${user.role}`);
      }

      // Check if password is hashed (bcrypt hashes start with $2a$ or $2b$)
      if (user.password) {
        const isHashed = user.password.startsWith("$2a$") || user.password.startsWith("$2b$");
        
        if (!isHashed) {
          console.log(`  Password is not hashed, hashing now...`);
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
          console.log(`  Password hashed successfully`);
        }
      }

      // Save the fixed user
      await user.save();
      console.log(`  ✅ User fixed and saved`);
    }

    console.log("\n✅ All users fixed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing users:", error);
    process.exit(1);
  }
}

fixUsers();


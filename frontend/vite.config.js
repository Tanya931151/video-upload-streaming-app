import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";

dotenv.config();

const VITE_API_BASE_URL =
  process.env.VITE_API_BASE_URL || "http://localhost:5000";

const VITE_SOCKET_URL = process.env.VITE_SOCKET_URL || "http://localhost:5000";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.VITE_API_BASE_URL": JSON.stringify(VITE_API_BASE_URL),
    "process.env.VITE_SOCKET_URL": JSON.stringify(VITE_SOCKET_URL),
  },
});

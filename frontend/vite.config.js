import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});

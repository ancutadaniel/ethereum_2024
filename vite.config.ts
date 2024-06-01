import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  plugins: [react()],
  root: "src", // Specify 'src' as the root directory
  server: {
    open: true,
    port: 3000,
  },
  build: {
    outDir: "../dist", // Specify the output directory for the build
    emptyOutDir: true,
  },
  define: {
    "process.env": process.env,
  },
});

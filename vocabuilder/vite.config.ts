import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Use relative paths so it works no matter what subfolder GitLab Pages uses
  base: "./",
});

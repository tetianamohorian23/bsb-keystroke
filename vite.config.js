import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Port servera: predvolene 8000, start.bat ho pri obsadenom porte zmeni na 8001.
      "/api": `http://127.0.0.1:${process.env.API_PORT || 8000}`,
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: rootDir,

  plugins: [react()],

  build: {
    outDir: resolve(rootDir, "dist"),
  
    chunkSizeWarningLimit: 700,

    rollupOptions: {
      output: {
       
        manualChunks: {
          
          vendor: [
            "react",
            "react-dom",
          ],

          
          router: [
            "react-router-dom",
          ],

          
          socket: [
            "socket.io-client",
          ],

          dnd: [
            "@hello-pangea/dnd",
          ],
        },
      },
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";


export default defineConfig({
  plugins: [react()],

  build: {
  
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
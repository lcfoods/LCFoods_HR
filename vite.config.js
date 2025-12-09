import { defineConfig } from 'vite';

export default defineConfig({
  // Base must be relative for Capacitor/Android to load assets from file://
  base: './', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000
  }
});

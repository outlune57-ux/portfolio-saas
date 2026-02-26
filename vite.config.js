import { defineConfig } from 'vite';

export default defineConfig({
  // Rewrites all routes to index.html (SPA mode)
  // Works out of the box on Vercel with vercel.json below
  server: {
    port: 3000,
  },
});

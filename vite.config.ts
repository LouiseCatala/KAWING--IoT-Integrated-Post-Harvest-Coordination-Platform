import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'copy-php-vendor-for-cpanel',
        closeBundle() {
          const vendorSource = path.resolve(__dirname, 'vendor');
          const vendorDestination = path.resolve(__dirname, 'dist/vendor');
          if (fs.existsSync(vendorSource)) {
            fs.cpSync(vendorSource, vendorDestination, { recursive: true });
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        }, 
      },
      // Allow resource-constrained development environments to disable HMR.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching with HMR to avoid unnecessary CPU usage.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

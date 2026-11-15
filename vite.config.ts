import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  resolve: {
    alias: {
      'shared-api': path.resolve(__dirname, './Shared/API'),
      'shared-ui': path.resolve(__dirname, './Shared/UI'),
      'shared-components': path.resolve(__dirname, './Shared/components'),
      'auth-client': path.resolve(__dirname, './Auth.Client'),
      'ecommerce-client': path.resolve(__dirname, './ecommerce.client'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});

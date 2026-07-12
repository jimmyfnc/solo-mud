import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
  ...(mode === 'test' ? {} : {
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/socket.io': {
          target: 'http://localhost:3001',
          ws: true,
        },
      },
    },
  }),
}));

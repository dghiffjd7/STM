import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/renderer': path.resolve(__dirname, './src/renderer'),
    },
  },
  server: {
    port: 5173,
  },
  define: {
    // 在 renderer 中将 process.env 替换为一个安全的对象
    // 只暴露 NODE_ENV，其他环境变量由 main process 管理
    'process.env': JSON.stringify({
      NODE_ENV: process.env.NODE_ENV || 'development',
    }),
  },
});

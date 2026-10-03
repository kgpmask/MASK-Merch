import { defineConfig } from 'vitest/config';
import nextEnv from '@next/env';
import path from 'path';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

// Verification check
console.log('Loaded MONGO_URL:', process.env.MONGO_URL);

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
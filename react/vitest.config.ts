import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: { fs: { allow: ['..'] } }, // the Blade script test reads ../blade/animated-number.js
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});

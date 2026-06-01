import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mantine-vendor': [
            '@mantine/core',
            '@mantine/hooks',
            '@mantine/notifications',
            '@mantine/modals',
            '@mantine/dates',
            'dayjs',
          ],
          'charts-vendor': ['recharts'],
          'icons-vendor': ['@tabler/icons-react'],
          'query-vendor': ['@tanstack/react-query'],
          'i18n-vendor': ['i18next', 'react-i18next'],
          'sentry-vendor': ['@sentry/react'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})

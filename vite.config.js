import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Vite resolves these extensions in order — covers both .js and .jsx imports
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
  },
  // server: {
  //   port: 3000,
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:5000',
  //       changeOrigin: true,
  //     },
  //   },
  // },
  server: {
  port: 3000,
  proxy: {
    '/api': {
      target: process.env.VITE_API_URL || 'http://localhost:5000',
      changeOrigin: true,
    },
  },
},
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Increase chunk size warning limit — MUI + FullCalendar are large
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          'react-vendor':    ['react', 'react-dom', 'react-router-dom'],
          'mui-core':        ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'mui-datagrid':    ['@mui/x-data-grid'],
          'fullcalendar':    ['@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction'],
          'charts':          ['recharts'],
        },
      },
    },
  },
  // Ensure React is available globally for JSX without explicit imports
  define: {
    global: 'globalThis',
  },
});

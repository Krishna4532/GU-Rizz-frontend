import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: 'http://localhost:5000',
          ws: true,
          changeOrigin: true,
        },
      },
    },
    define: {
      __API_BASE__:    JSON.stringify(env.VITE_API_URL    || ''),
      __SOCKET_BASE__: JSON.stringify(env.VITE_SOCKET_URL || '/'),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});

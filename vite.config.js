import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/pursuing/',
  plugins: [
    react(),
    {
      name: 'html-inject-reload-on-error',
      transformIndexHtml(html) {
        // After deploy, users with stale cached index.html will 404 on the
        // old JS bundle (filenames are hashed). If the root div is still
        // empty after 3s, force a one-time reload to get the fresh version.
        return html.replace(
          '</head>',
          '<script>(function(){var k="_rl";var t=sessionStorage.getItem(k);if(t){sessionStorage.removeItem(k)}else{setTimeout(function(){var r=document.getElementById("root");if(r&&!r.children.length&&!sessionStorage.getItem(k)){sessionStorage.setItem(k,"1");location.reload()}},3000)}})();</script></head>'
        );
      },
    },
  ],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v1'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Authorization', 'Bearer sk-f506eba81c5c485bb03e76774aedc7ef');
          });
        },
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'framer-motion'],
  },
})

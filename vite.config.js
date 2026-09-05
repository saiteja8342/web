import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dashboardRewrite = () => ({
  name: 'dashboard-rewrite',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const pathname = req.url ? req.url.split('?')[0] : '';
      const search = req.url && req.url.includes('?') ? '?' + req.url.split('?')[1] : '';

      const routeMap = {
        '/dashboard/admin': '/dashboard/admin/index.html',
        '/dashboard/admin/': '/dashboard/admin/index.html',
        '/dashboard/editor': '/dashboard/editor/index.html',
        '/dashboard/editor/': '/dashboard/editor/index.html',
        '/dashboard/client': '/dashboard/client/index.html',
        '/dashboard/client/': '/dashboard/client/index.html',
        '/login': '/login.html',
        '/login/': '/login.html',
        '/admin/login': '/admin/login.html',
        '/admin/login/': '/admin/login.html',
        '/admin': '/admin.html',
        '/admin/': '/admin.html',
        '/editor': '/editor.html',
        '/editor/': '/editor.html',
        '/client': '/client.html',
        '/client/': '/client.html',
        '/about': '/about.html',
        '/about/': '/about.html',
        '/work': '/work.html',
        '/work/': '/work.html',
        '/our-work': '/our-work.html',
        '/our-work/': '/our-work.html',
        '/terms': '/terms.html',
        '/terms/': '/terms.html',
      };

      if (routeMap[pathname]) {
        req.url = routeMap[pathname] + search;
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), dashboardRewrite()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        about: fileURLToPath(new URL('./about.html', import.meta.url)),
        work: fileURLToPath(new URL('./work.html', import.meta.url)),
        ourWork: fileURLToPath(new URL('./our-work.html', import.meta.url)),
        terms: fileURLToPath(new URL('./terms.html', import.meta.url)),
        login: fileURLToPath(new URL('./login.html', import.meta.url)),
        adminLogin: fileURLToPath(new URL('./admin/login.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin.html', import.meta.url)),
        editor: fileURLToPath(new URL('./editor.html', import.meta.url)),
        client: fileURLToPath(new URL('./client.html', import.meta.url)),
        dashboardAdmin: fileURLToPath(new URL('./dashboard/admin/index.html', import.meta.url)),
        dashboardEditor: fileURLToPath(new URL('./dashboard/editor/index.html', import.meta.url)),
        dashboardClient: fileURLToPath(new URL('./dashboard/client/index.html', import.meta.url)),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('gsap') || id.includes('framer-motion')) {
              return 'vendor-animation';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('lenis')) {
              return 'vendor-scroll';
            }
            return 'vendor-core';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})

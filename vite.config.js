import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
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
        '/sign-in': '/login.html',
        '/sign-in/': '/login.html',
        '/signin': '/login.html',
        '/signin/': '/login.html',
        '/sign-up': '/login.html',
        '/sign-up/': '/login.html',
        '/signup': '/login.html',
        '/signup/': '/login.html',
        '/admin/login': '/admin/login/index.html',
        '/admin/login/': '/admin/login/index.html',
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
        '/privacy': '/privacy.html',
        '/privacy/': '/privacy.html',
        '/privacy-policy': '/privacy.html',
        '/privacy-policy/': '/privacy.html',
        '/feedback': '/feedback.html',
        '/feedback/': '/feedback.html',
      };

      if (routeMap[pathname]) {
        req.url = routeMap[pathname] + search;
      }
      next();
    });
  }
});

// Candidate inputs across multi-page entrypoints
const candidateEntries = {
  main: path.resolve(__dirname, 'index.html'),
  about: path.resolve(__dirname, 'about.html'),
  work: path.resolve(__dirname, 'work.html'),
  ourWork: path.resolve(__dirname, 'our-work.html'),
  terms: path.resolve(__dirname, 'terms.html'),
  privacy: path.resolve(__dirname, 'privacy.html'),
  feedback: path.resolve(__dirname, 'feedback.html'),
  login: path.resolve(__dirname, 'login.html'),
  adminLogin: path.resolve(__dirname, 'admin/login.html'),
  adminLoginIndex: path.resolve(__dirname, 'admin/login/index.html'),
  admin: path.resolve(__dirname, 'admin.html'),
  editor: path.resolve(__dirname, 'editor.html'),
  client: path.resolve(__dirname, 'client.html'),
  dashboardAdmin: path.resolve(__dirname, 'dashboard/admin/index.html'),
  dashboardEditor: path.resolve(__dirname, 'dashboard/editor/index.html'),
  dashboardClient: path.resolve(__dirname, 'dashboard/client/index.html'),
};

// Only include entry points that actually exist on disk to prevent UNRESOLVED_ENTRY build errors on CI/CD
const resolvedInputs = Object.fromEntries(
  Object.entries(candidateEntries).filter(([_, targetPath]) => fs.existsSync(targetPath))
);

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
      input: resolvedInputs,
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

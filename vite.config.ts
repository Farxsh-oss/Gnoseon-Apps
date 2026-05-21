import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  server: {
    port: 2000,
    proxy: {
      '/api/lm-studio': {
        target: 'http://192.168.47.1:1234',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lm-studio/, ''),
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['better-sqlite3', 'bcryptjs'],
  },
  build: {
    rollupOptions: {
      external: ['better-sqlite3', 'bcryptjs'],
    },
    commonjsOptions: {
      include: [/node_modules/],
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv', '**/*.png'],
})

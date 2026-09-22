import { wayfinder } from '@laravel/vite-plugin-wayfinder'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import laravel from 'laravel-vite-plugin'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isPreview = mode === 'preview' || process.env.VITE_PREVIEW === 'true'

  return {
    plugins: [
      !isPreview &&
        laravel({
          input: ['resources/css/app.css', 'resources/js/app.tsx'],
          ssr: 'resources/js/ssr.tsx',
          refresh: true,
        }),
      react(),
      tailwindcss(),
      wayfinder({
        formVariants: true,
      }),
    ].filter(Boolean),
    esbuild: {
      jsx: 'automatic',
    },
    preview: {
      port: 4173,
    },
    build: {
      outDir: isPreview ? 'dist' : 'public/build',
      rollupOptions: isPreview
        ? {
            input: path.resolve(__dirname, 'index.html'),
          }
        : undefined,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'resources/js'),
      },
    },
  }
})

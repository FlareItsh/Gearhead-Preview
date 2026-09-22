import '../css/app.css'

import { createInertiaApp, router } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot } from 'react-dom/client'
import { initializeTheme } from './hooks/use-appearance'

import axios from 'axios'

const appName = import.meta.env.VITE_APP_NAME || 'Laravel'

// Configure axios global defaults
axios.defaults.withCredentials = true
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
  resolve: (name) =>
    resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),

  setup({ el, App, props }) {
    const root = createRoot(el)
    root.render(<App {...props} />)
  },
  progress: {
    color: '#4B5563',
  },
})

// Initialize theme on load
initializeTheme()

// Re-apply theme during navigation to persist user's choice
router.on('start', () => {
  const savedAppearance =
    (localStorage.getItem('appearance') as 'light' | 'dark' | 'system') || 'system'
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = savedAppearance === 'dark' || (savedAppearance === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
})

router.on('finish', () => {
  const savedAppearance =
    (localStorage.getItem('appearance') as 'light' | 'dark' | 'system') || 'system'
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = savedAppearance === 'dark' || (savedAppearance === 'system' && prefersDark)
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
})

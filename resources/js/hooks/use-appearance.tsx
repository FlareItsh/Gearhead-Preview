import { useCallback, useEffect, useState } from 'react'

export type Appearance = 'light' | 'dark' | 'system'

const prefersDark = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const setCookie = (name: string, value: string, days = 365) => {
  if (typeof document === 'undefined') {
    return
  }

  const maxAge = days * 24 * 60 * 60
  document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`
}

const applyTheme = (appearance: Appearance) => {
  const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark())

  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}

const mediaQuery = () => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.matchMedia('(prefers-color-scheme: dark)')
}

const handleSystemThemeChange = () => {
  const currentAppearance = localStorage.getItem('appearance') as Appearance
  applyTheme(currentAppearance || 'system')
}

export function initializeTheme() {
  const savedAppearance = (localStorage.getItem('appearance') as Appearance) || 'system'

  applyTheme(savedAppearance)

  // Add the event listener for system theme changes...
  mediaQuery()?.addEventListener('change', handleSystemThemeChange)
}

export function useAppearance() {
  const [appearance, setAppearance] = useState<Appearance>('system')

  const updateAppearance = useCallback((mode: Appearance) => {
    setAppearance(mode)

    // Store in localStorage for client-side persistence...
    localStorage.setItem('appearance', mode)

    // Store in cookie for SSR...
    setCookie('appearance', mode)

    applyTheme(mode)

    // Dispatch custom event for same-tab sync
    window.dispatchEvent(new CustomEvent('appearance-change', { detail: mode }))
  }, [])

  useEffect(() => {
    const savedAppearance = localStorage.getItem('appearance') as Appearance | null
    setAppearance(savedAppearance || 'system')

    const handleAppearanceChange = (e: Event) => {
      const mode = (e as CustomEvent).detail as Appearance
      setAppearance(mode)
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'appearance' && e.newValue) {
        setAppearance(e.newValue as Appearance)
      }
    }

    window.addEventListener('appearance-change', handleAppearanceChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('appearance-change', handleAppearanceChange)
      window.removeEventListener('storage', handleStorageChange)
      mediaQuery()?.removeEventListener('change', handleSystemThemeChange)
    }
  }, [])

  return { appearance, updateAppearance } as const
}

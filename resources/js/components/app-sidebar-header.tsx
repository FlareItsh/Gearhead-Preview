import { Breadcrumbs } from '@/components/breadcrumbs'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAppearance } from '@/hooks/use-appearance'
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const { updateAppearance } = useAppearance()

  // Toggle theme function
  const toggleTheme = () => {
    // If currently dark, switch to light. If light, switch to dark.
    // This overrides 'system' with an explicit choice, which is standard for toggles.
    updateAppearance(isDarkMode ? 'light' : 'dark')
  }

  // Track theme changes
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }

    // Initial check
    checkTheme()

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Breadcrumbs breadcrumbs={breadcrumbs} />
      </div>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="ml-auto rounded-md p-2 text-foreground transition-all duration-300 hover:bg-secondary hover:text-highlight active:scale-95"
        aria-label="Toggle theme"
      >
        <div className="relative h-5 w-5">
          <Sun
            size={20}
            className={`absolute inset-0 transition-all duration-500 ${
              isDarkMode ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
          />
          <Moon
            size={20}
            className={`absolute inset-0 transition-all duration-500 ${
              !isDarkMode ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
          />
        </div>
      </button>
    </header>
  )
}

import { dashboard, login, register } from '@/routes'
import { type SharedData } from '@/types'
import { Link, usePage } from '@inertiajs/react'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { route } from 'ziggy-js'
import { Button } from './ui/button'

type NavLink = {
  href: string
  label: string
  section?: string
}

const defaultNavLinks: NavLink[] = [
  { href: '#home', label: 'Home', section: 'home' },
  { href: '#about', label: 'About', section: 'about' },
  { href: '#services', label: 'Services', section: 'services' },
  { href: '#contact', label: 'Contact', section: 'contact' },
]

interface HeaderProps {
  navLinks?: NavLink[]
}

export default function Header({ navLinks }: HeaderProps) {
  const { auth } = usePage().props as unknown as SharedData
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('appearance')
    if (saved === 'light') return false
    if (saved === 'dark') return true
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const hash = typeof window !== 'undefined' ? window.location.hash : ''
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'

  const linksToUse = navLinks ?? defaultNavLinks

  // Toggle theme function
  const toggleTheme = () => {
    const html = document.documentElement
    const newTheme = html.classList.contains('dark') ? 'light' : 'dark'

    if (newTheme === 'dark') {
      html.classList.add('dark')
      localStorage.setItem('appearance', 'dark')
      setIsDarkMode(true)
    } else {
      html.classList.remove('dark')
      localStorage.setItem('appearance', 'light')
      setIsDarkMode(false)
    }
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

  // Track active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = linksToUse
        .filter((link) => link.section)
        .map((link) => link.section as string)

      // Get current scroll position
      const scrollPosition = window.scrollY + 100 // Offset for header height

      // Find which section is currently in view
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i])
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i])
          break
        }
      }
    }

    // Add scroll listener
    window.addEventListener('scroll', handleScroll)
    // Initial check
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [linksToUse])

  const isActiveLink = (link: NavLink) => {
    // If we're on a route page, use route-based matching only
    if (currentPath !== '/' && link.section) {
      return currentPath === `/${link.section}`
    }

    // If link has a section and we're on home, check if it's the active section
    if (link.section) {
      return link.section === activeSection
    }

    if (link.href === '/') {
      return currentPath === '/' && !hash
    }
    return link.href === currentPath || (link.href.startsWith('#') && link.href === hash)
  }

  const linkClasses = (isActive: boolean) => {
    return isActive
      ? 'rounded-sm bg-tertiary px-3 py-2 font-bold text-highlight transition-colors hover:bg-tertiary/80'
      : 'px-3 py-2 hover:text-highlight'
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background py-3 shadow-sm">
      <nav className="mx-auto flex max-w-[95rem] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={route('home')}
          className="flex-shrink-0"
        >
          <img
            src={isDarkMode ? '/Gearhead-Logo-DarkMode.png' : '/Gearhead-Logo.png'}
            alt="Gearhead Logo"
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden items-center gap-5 rounded-md bg-secondary px-1 py-1 font-medium text-secondary-foreground md:flex">
          {linksToUse.map((link) => {
            const isGuest = !auth.user
            const isOnServicesPage = currentPath.includes('/services')
            const href = isGuest && isOnServicesPage ? route('home') + link.href : link.href

            return (
              <a
                key={link.label}
                href={href}
                className={linkClasses(isActiveLink(link))}
              >
                <li>{link.label}</li>
              </a>
            )
          })}
        </ul>

        {/* Desktop Buttons */}
        <div className="hidden items-center gap-3 text-base md:flex">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 text-foreground transition-all duration-300 hover:bg-secondary hover:text-highlight active:scale-95"
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

          {auth.user ? (
            // Authenticated users: admin -> dashboard, customer -> customer-dashboard
            <Link href={dashboard()}>
              <Button
                className="w-full"
                variant="highlight"
              >
                {auth.user.role === 'customer' ? 'Book Now' : 'Dashboard'}
              </Button>
            </Link>
          ) : (
            <>
              <Link href={login()}>
                <Button variant="outline">Log in</Button>
              </Link>
              <Link href={register()}>
                <Button variant="highlight">Register</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground transition-all hover:bg-secondary hover:text-highlight md:hidden"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </nav>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-64 transform bg-background shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <img
              src={isDarkMode ? '/Gearhead-Logo-DarkMode.png' : '/Gearhead-Logo.png'}
              alt="Gearhead Logo"
              className="h-8 w-auto"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-2 text-foreground transition-all hover:bg-secondary hover:text-highlight"
            >
              <X size={24} />
            </button>
          </div>

          {/* Sidebar Links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="flex flex-col gap-2">
              {linksToUse.map((link) => {
                const isGuest = !auth.user
                const isOnServicesPage = currentPath.includes('/services')
                const href = isGuest && isOnServicesPage ? route('home') + link.href : link.href

                return (
                  <li key={link.label}>
                    <a
                      href={href}
                      onClick={() => setIsOpen(false)}
                      className={
                        isActiveLink(link)
                          ? 'block rounded-md bg-tertiary px-4 py-3 font-bold text-highlight transition-colors'
                          : 'block rounded-md px-4 py-3 text-foreground transition-colors hover:bg-secondary hover:text-highlight'
                      }
                    >
                      {link.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Sidebar Action Buttons */}
          <div className="border-t border-border p-4">
            <div className="flex flex-col gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="flex w-full items-center justify-between rounded-md bg-secondary p-3 text-foreground transition-all duration-300 hover:bg-secondary/80 hover:text-highlight active:scale-95"
                aria-label="Toggle theme"
              >
                <span className="text-sm font-medium">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
                <div className="relative h-5 w-5">
                  <Sun
                    size={20}
                    className={`absolute inset-0 rotate-0 transition-all duration-500 ${
                      isDarkMode ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                    }`}
                  />
                  <Moon
                    size={20}
                    className={`absolute inset-0 rotate-180 transition-all duration-500 ${
                      !isDarkMode ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                    }`}
                  />
                </div>
              </button>

              {auth.user ? (
                <Link href={dashboard()}>
                  <Button
                    className="w-full"
                    variant="highlight"
                    onClick={() => setIsOpen(false)}
                  >
                    {auth.user.role === 'customer' ? 'Book Now' : 'Dashboard'}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/services">
                    <Button
                      variant="highlight"
                      className="w-full"
                      onClick={() => setIsOpen(false)}
                    >
                      Book Now
                    </Button>
                  </Link>
                  <Link href={login()}>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsOpen(false)}
                    >
                      Log in
                    </Button>
                  </Link>
                  <Link href={register()}>
                    <Button
                      variant="highlight"
                      className="w-full"
                      onClick={() => setIsOpen(false)}
                    >
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </header>
  )
}

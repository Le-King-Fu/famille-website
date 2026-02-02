'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useState } from 'react'
import {
  Home,
  Calendar,
  Gamepad2,
  Image,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Sun,
  Moon,
} from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

const navigation = [
  { name: 'Accueil', href: '/', icon: Home, hideForChild: false },
  { name: 'Calendrier', href: '/calendrier', icon: Calendar, hideForChild: false },
  { name: 'Jeux', href: '/jeux', icon: Gamepad2, hideForChild: false },
  { name: 'Photos', href: '/photos', icon: Image, hideForChild: false },
  { name: 'Forum', href: '/forum', icon: MessageSquare, hideForChild: true },
]

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  const isAdmin = session?.user?.role === 'ADMIN'
  const isChild = session?.user?.role === 'CHILD'

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  // Filter navigation based on user role
  const filteredNav = navigation.filter((item) => !(item.hideForChild && isChild))

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm dark:bg-gray-900/80">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <span className="font-bold text-bleu text-lg hidden sm:block">
              Ma Famille Landry
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-bleu text-white'
                      : 'text-gray-600 hover:bg-bleu/10 hover:text-bleu dark:text-gray-300'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/admin'
                    ? 'bg-terracotta text-white'
                    : 'text-gray-600 hover:bg-terracotta/10 hover:text-terracotta dark:text-gray-300'
                }`}
              >
                <Settings className="h-4 w-4" />
                Admin
              </Link>
            )}
          </div>

          {/* User menu */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              title={resolvedTheme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {session?.user && (
              <>
                <Link
                  href="/profil"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:block">{session.user.name}</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/portail' })}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:block">Déconnexion</span>
                </button>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-1">
              {filteredNav.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-bleu text-white'
                        : 'text-gray-600 hover:bg-bleu/10 hover:text-bleu dark:text-gray-300'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/admin'
                      ? 'bg-terracotta text-white'
                      : 'text-gray-600 hover:bg-terracotta/10 hover:text-terracotta dark:text-gray-300'
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

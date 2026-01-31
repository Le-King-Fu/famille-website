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
} from 'lucide-react'

const navigation = [
  { name: 'Accueil', href: '/', icon: Home },
  { name: 'Calendrier', href: '/calendrier', icon: Calendar },
  { name: 'Jeux', href: '/jeux', icon: Gamepad2 },
  { name: 'Photos', href: '/photos', icon: Image },
  { name: 'Forum', href: '/forum', icon: MessageSquare },
]

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAdmin = session?.user?.role === 'ADMIN'

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
            {navigation.map((item) => {
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
              {navigation.map((item) => {
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

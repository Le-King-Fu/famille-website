import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse, type NextFetchEvent, type NextMiddleware, type NextRequest } from 'next/server'
import { pauseResponse } from '@/lib/pause'

const { auth } = NextAuth(authConfig)

const authMiddleware = auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Pages publiques (portail de sécurité et connexion)
  const publicPaths = ['/portail', '/connexion', '/inscription']
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // API routes pour l'auth
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // API pour vérifier les questions de sécurité (accessible sans auth)
  if (pathname.startsWith('/api/security')) {
    return NextResponse.next()
  }

  // Si non connecté et page protégée, rediriger vers le portail
  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL('/portail', req.url))
  }

  // Si connecté et sur page publique (sauf accueil), rediriger vers accueil
  if (isLoggedIn && isPublicPath) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Vérifier les permissions admin
  if (pathname.startsWith('/admin') && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Bloquer l'accès au forum pour les enfants
  if (pathname.startsWith('/forum') && req.auth?.user?.role === 'CHILD') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Vérifier si l'utilisateur doit changer son mot de passe
  if (
    isLoggedIn &&
    req.auth?.user?.mustChangePassword &&
    pathname !== '/profil/changer-mot-de-passe' &&
    pathname !== '/api/users/me/password'
  ) {
    return NextResponse.redirect(new URL('/profil/changer-mot-de-passe', req.url))
  }

  return NextResponse.next()
})

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // Paused site: short-circuit before auth, nothing else is reachable
  const paused = pauseResponse(req)
  if (paused) return paused

  return (authMiddleware as unknown as NextMiddleware)(req, event)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

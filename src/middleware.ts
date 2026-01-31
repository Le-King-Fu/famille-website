import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
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

  // Vérifier si l'utilisateur doit changer son mot de passe
  if (
    isLoggedIn &&
    req.auth?.user?.mustChangePassword &&
    pathname !== '/profil/changer-mot-de-passe'
  ) {
    return NextResponse.redirect(new URL('/profil/changer-mot-de-passe', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

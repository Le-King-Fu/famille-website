import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/connexion',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.mustChangePassword = user.mustChangePassword
      }
      // Re-read mustChangePassword from DB when session is updated
      if (trigger === 'update' && token.id) {
        const { db } = await import('@/lib/db')
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { mustChangePassword: true },
        })
        if (dbUser) {
          token.mustChangePassword = dbUser.mustChangePassword
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.mustChangePassword = token.mustChangePassword as boolean
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 3 * 24 * 60 * 60, // 3 jours
  },
  providers: [], // Configured in auth.ts
}

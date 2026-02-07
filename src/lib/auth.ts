import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { authConfig } from './auth.config'
import { checkRateLimit, recordFailedAttempt, resetAttempts } from './rate-limit'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = (credentials.email as string).toLowerCase()

        // Check email-based rate limit
        const limit = await checkRateLimit(email, 'login', 5)
        if (!limit.allowed) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email },
        })

        if (!user) {
          await recordFailedAttempt(email, 'login', 5, 15)
          return null
        }

        // Reject inactive users
        if (!user.isActive) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          await recordFailedAttempt(email, 'login', 5, 15)
          return null
        }

        // Success: reset attempts and update last login
        await resetAttempts(email, 'login')

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        }
      },
    }),
  ],
})

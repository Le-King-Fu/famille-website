import { NextRequest } from 'next/server'
import { handlers } from '@/lib/auth'
import { getClientIP, checkRateLimit } from '@/lib/rate-limit'

export const GET = handlers.GET

export async function POST(request: NextRequest) {
  // Only rate-limit credential sign-in attempts
  if (request.nextUrl.pathname.includes('/callback/credentials')) {
    const ip = getClientIP(request)
    const limit = await checkRateLimit(ip, 'login', 5)
    if (!limit.allowed) {
      return Response.json(
        { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
        { status: 429 }
      )
    }
  }
  return handlers.POST(request)
}

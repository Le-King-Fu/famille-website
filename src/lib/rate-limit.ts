import { NextRequest } from 'next/server'
import { db } from './db'

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return '127.0.0.1'
}

export interface RateLimitResult {
  allowed: boolean
  attemptsLeft: number
  blockedUntil?: Date
}

export async function checkRateLimit(
  identifier: string,
  type: string,
  maxAttempts: number,
): Promise<RateLimitResult> {
  const attempt = await db.securityAttempt.findUnique({
    where: { ipAddress_type: { ipAddress: identifier, type } },
  })

  if (attempt?.blockedUntil && attempt.blockedUntil > new Date()) {
    return {
      allowed: false,
      attemptsLeft: 0,
      blockedUntil: attempt.blockedUntil,
    }
  }

  // If block expired, treat as allowed (attempts will be reset on next record)
  const currentAttempts = attempt && attempt.blockedUntil && attempt.blockedUntil <= new Date()
    ? 0
    : (attempt?.attempts ?? 0)

  return {
    allowed: currentAttempts < maxAttempts,
    attemptsLeft: Math.max(0, maxAttempts - currentAttempts),
  }
}

export async function recordFailedAttempt(
  identifier: string,
  type: string,
  maxAttempts: number,
  blockMinutes: number,
): Promise<RateLimitResult> {
  const attempt = await db.securityAttempt.upsert({
    where: { ipAddress_type: { ipAddress: identifier, type } },
    create: {
      ipAddress: identifier,
      type,
      attempts: 1,
    },
    update: {
      // Reset if block expired, otherwise increment
      attempts: {
        increment: 1,
      },
    },
  })

  // If block had expired, reset and set attempts to 1
  if (attempt.blockedUntil && attempt.blockedUntil <= new Date()) {
    const reset = await db.securityAttempt.update({
      where: { id: attempt.id },
      data: {
        attempts: 1,
        blockedUntil: null,
      },
    })
    return {
      allowed: true,
      attemptsLeft: maxAttempts - 1,
      blockedUntil: reset.blockedUntil ?? undefined,
    }
  }

  // Block if threshold reached
  if (attempt.attempts >= maxAttempts && !attempt.blockedUntil) {
    const blocked = await db.securityAttempt.update({
      where: { id: attempt.id },
      data: {
        blockedUntil: new Date(Date.now() + blockMinutes * 60 * 1000),
      },
    })
    return {
      allowed: false,
      attemptsLeft: 0,
      blockedUntil: blocked.blockedUntil ?? undefined,
    }
  }

  return {
    allowed: attempt.attempts < maxAttempts,
    attemptsLeft: Math.max(0, maxAttempts - attempt.attempts),
    blockedUntil: attempt.blockedUntil ?? undefined,
  }
}

export async function resetAttempts(
  identifier: string,
  type: string,
): Promise<void> {
  await db.securityAttempt.deleteMany({
    where: { ipAddress: identifier, type },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
  return ip
}

export async function GET(request: NextRequest) {
  try {
    const ipAddress = getClientIP(request)

    // Vérifier si l'IP est bloquée
    const attempt = await db.securityAttempt.findFirst({
      where: { ipAddress },
    })

    if (attempt?.blockedUntil && attempt.blockedUntil > new Date()) {
      return NextResponse.json({
        blocked: true,
        blockedUntil: attempt.blockedUntil,
      })
    }

    // Récupérer 3 questions aléatoires actives
    const questions = await db.securityQuestion.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      take: 3,
      select: {
        id: true,
        question: true,
      },
    })

    const attemptsLeft = attempt ? 3 - attempt.attempts : 3

    return NextResponse.json({
      questions,
      attemptsLeft: Math.max(0, attemptsLeft),
    })
  } catch (error) {
    console.error('Error fetching security questions:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

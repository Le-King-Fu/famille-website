import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { getClientIP, checkRateLimit, recordFailedAttempt, resetAttempts } from '@/lib/rate-limit'

const MAX_ATTEMPTS = 3
const BLOCK_MINUTES = 15

export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIP(request)
    const { answers } = await request.json()

    // Vérifier si l'IP est bloquée
    const limit = await checkRateLimit(ipAddress, 'security', MAX_ATTEMPTS)
    if (!limit.allowed) {
      return NextResponse.json({
        success: false,
        blocked: true,
        blockedUntil: limit.blockedUntil,
      })
    }

    // Vérifier les réponses
    const questionIds = Object.keys(answers)
    const questions = await db.securityQuestion.findMany({
      where: { id: { in: questionIds } },
    })

    let allCorrect = true
    for (const question of questions) {
      const userAnswer = answers[question.id]?.toLowerCase().trim()
      const correctAnswer = question.answer.toLowerCase().trim()

      if (userAnswer !== correctAnswer) {
        allCorrect = false
        break
      }
    }

    if (allCorrect) {
      // Réinitialiser les tentatives
      await resetAttempts(ipAddress, 'security')

      // Créer un cookie de session pour indiquer que le portail est passé
      const cookieStore = await cookies()
      cookieStore.set('security_verified', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 30, // 30 minutes
      })

      return NextResponse.json({ success: true })
    }

    // Incrémenter les tentatives
    const result = await recordFailedAttempt(ipAddress, 'security', MAX_ATTEMPTS, BLOCK_MINUTES)

    if (result.blockedUntil) {
      return NextResponse.json({
        success: false,
        blocked: true,
        blockedUntil: result.blockedUntil,
      })
    }

    return NextResponse.json({
      success: false,
      attemptsLeft: result.attemptsLeft,
    })
  } catch (error) {
    console.error('Error verifying security questions:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

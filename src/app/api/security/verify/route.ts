import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
  return ip
}

export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIP(request)
    const { answers } = await request.json()

    // Vérifier si l'IP est bloquée
    let attempt = await db.securityAttempt.findFirst({
      where: { ipAddress },
    })

    if (attempt?.blockedUntil && attempt.blockedUntil > new Date()) {
      return NextResponse.json({
        success: false,
        blocked: true,
        blockedUntil: attempt.blockedUntil,
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
      if (attempt) {
        await db.securityAttempt.delete({ where: { id: attempt.id } })
      }

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
    if (attempt) {
      attempt = await db.securityAttempt.update({
        where: { id: attempt.id },
        data: {
          attempts: attempt.attempts + 1,
          blockedUntil:
            attempt.attempts + 1 >= 3
              ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
              : null,
        },
      })
    } else {
      attempt = await db.securityAttempt.create({
        data: {
          ipAddress,
          attempts: 1,
        },
      })
    }

    if (attempt.blockedUntil) {
      return NextResponse.json({
        success: false,
        blocked: true,
        blockedUntil: attempt.blockedUntil,
      })
    }

    return NextResponse.json({
      success: false,
      attemptsLeft: 3 - attempt.attempts,
    })
  } catch (error) {
    console.error('Error verifying security questions:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

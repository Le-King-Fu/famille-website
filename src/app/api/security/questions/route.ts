import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getClientIP, checkRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const ipAddress = getClientIP(request)

    // Vérifier si l'IP est bloquée
    const limit = await checkRateLimit(ipAddress, 'security', 3)
    if (!limit.allowed) {
      return NextResponse.json({
        blocked: true,
        blockedUntil: limit.blockedUntil,
      })
    }

    // Récupérer toutes les questions actives
    const allQuestions = await db.securityQuestion.findMany({
      where: { isActive: true },
      select: {
        id: true,
        question: true,
      },
    })

    // Sélectionner UNE question aléatoire
    const randomIndex = Math.floor(Math.random() * allQuestions.length)
    const questions = allQuestions.length > 0 ? [allQuestions[randomIndex]] : []

    return NextResponse.json({
      questions,
      attemptsLeft: limit.attemptsLeft,
    })
  } catch (error) {
    console.error('Error fetching security questions:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

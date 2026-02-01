import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { GameType } from '@prisma/client'

// POST /api/games/scores - Submit a game score
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Validate game type
    if (!body.game || !Object.values(GameType).includes(body.game)) {
      return NextResponse.json(
        { error: 'Type de jeu invalide' },
        { status: 400 }
      )
    }

    // Validate score
    if (typeof body.score !== 'number' || body.score < 0 || body.score > 10000000) {
      return NextResponse.json(
        { error: 'Score invalide' },
        { status: 400 }
      )
    }

    // Create score entry
    const gameScore = await db.gameScore.create({
      data: {
        game: body.game as GameType,
        score: Math.floor(body.score),
        metadata: body.metadata ?? null,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({ score: gameScore }, { status: 201 })
  } catch (error) {
    console.error('Error submitting score:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la soumission du score' },
      { status: 500 }
    )
  }
}

// GET /api/games/scores - Get leaderboard
export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const game = searchParams.get('game')
    const limitParam = searchParams.get('limit')
    const limit = Math.min(parseInt(limitParam ?? '10', 10) || 10, 50)

    // Build where clause
    const where = game && Object.values(GameType).includes(game as GameType)
      ? { game: game as GameType }
      : {}

    const scores = await db.gameScore.findMany({
      where,
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({ scores })
  } catch (error) {
    console.error('Error fetching scores:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des scores' },
      { status: 500 }
    )
  }
}

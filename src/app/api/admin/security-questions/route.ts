import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/security-questions - List all security questions
export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  try {
    const questions = await db.securityQuestion.findMany({
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error fetching security questions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des questions' },
      { status: 500 }
    )
  }
}

// POST /api/admin/security-questions - Create a new security question
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  try {
    const body = await request.json()

    if (!body.question || typeof body.question !== 'string' || body.question.trim().length === 0) {
      return NextResponse.json(
        { error: 'La question est requise' },
        { status: 400 }
      )
    }

    if (!body.answer || typeof body.answer !== 'string' || body.answer.trim().length === 0) {
      return NextResponse.json(
        { error: 'La réponse est requise' },
        { status: 400 }
      )
    }

    // Get the max order to append at the end
    const maxOrder = await db.securityQuestion.aggregate({
      _max: { order: true },
    })

    const question = await db.securityQuestion.create({
      data: {
        question: body.question.trim(),
        answer: body.answer.trim().toLowerCase(),
        isActive: body.isActive !== false,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    })

    return NextResponse.json({ question }, { status: 201 })
  } catch (error) {
    console.error('Error creating security question:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la question' },
      { status: 500 }
    )
  }
}

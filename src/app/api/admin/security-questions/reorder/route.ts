import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// PUT /api/admin/security-questions/reorder - Reorder security questions
export async function PUT(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  try {
    const body = await request.json()

    if (!Array.isArray(body.order)) {
      return NextResponse.json(
        { error: 'L\'ordre doit être un tableau d\'IDs' },
        { status: 400 }
      )
    }

    // Update each question's order
    await db.$transaction(
      body.order.map((id: string, index: number) =>
        db.securityQuestion.update({
          where: { id },
          data: { order: index },
        })
      )
    )

    // Return updated questions
    const questions = await db.securityQuestion.findMany({
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Error reordering security questions:', error)
    return NextResponse.json(
      { error: 'Erreur lors du réordonnancement des questions' },
      { status: 500 }
    )
  }
}

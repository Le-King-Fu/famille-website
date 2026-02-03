import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// PUT /api/admin/forum-categories/reorder - Reorder forum categories
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
        { error: "L'ordre doit être un tableau d'IDs" },
        { status: 400 }
      )
    }

    // Update each category's order
    await db.$transaction(
      body.order.map((id: string, index: number) =>
        db.forumCategory.update({
          where: { id },
          data: { order: index },
        })
      )
    )

    // Return updated categories
    const categories = await db.forumCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { topics: true },
        },
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error reordering forum categories:', error)
    return NextResponse.json(
      { error: 'Erreur lors du réordonnancement des catégories' },
      { status: 500 }
    )
  }
}

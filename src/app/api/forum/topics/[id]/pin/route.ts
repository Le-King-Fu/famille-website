import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// PUT /api/forum/topics/[id]/pin - Toggle pin status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Only admin can pin/unpin
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const { id: topicId } = await params

  try {
    const topic = await db.topic.findUnique({
      where: { id: topicId },
    })

    if (!topic) {
      return NextResponse.json({ error: 'Sujet non trouvé' }, { status: 404 })
    }

    // Toggle pin status
    const updatedTopic = await db.topic.update({
      where: { id: topicId },
      data: { isPinned: !topic.isPinned },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({ topic: updatedTopic })
  } catch (error) {
    console.error('Error toggling pin:', error)
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'épinglage" },
      { status: 500 }
    )
  }
}

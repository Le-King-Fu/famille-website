import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/forum/topics/[id] - Get topic with replies
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Block CHILD role from forum
  if (session.user.role === 'CHILD') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const { id: topicId } = await params

  try {
    const topic = await db.topic.findUnique({
      where: { id: topicId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            quotedReply: {
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!topic) {
      return NextResponse.json({ error: 'Sujet non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ topic })
  } catch (error) {
    console.error('Error fetching topic:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du sujet' },
      { status: 500 }
    )
  }
}

// DELETE /api/forum/topics/[id] - Delete topic (admin or author)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (session.user.role === 'CHILD') {
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

    // Only admin or author can delete
    if (session.user.role !== 'ADMIN' && topic.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer ce sujet' },
        { status: 403 }
      )
    }

    await db.topic.delete({
      where: { id: topicId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting topic:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du sujet' },
      { status: 500 }
    )
  }
}

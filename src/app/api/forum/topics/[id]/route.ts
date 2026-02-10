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
        reactions: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
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
                    lastName: true,
                  },
                },
              },
            },
            reactions: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true },
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

    // Check if topic is linked to an event hidden from this user
    if (session.user.role !== 'ADMIN') {
      const hiddenEvent = await db.event.findFirst({
        where: {
          topicId: topic.id,
          hiddenFrom: { some: { userId: session.user.id } },
        },
        select: { id: true },
      })
      if (hiddenEvent) {
        return NextResponse.json({ error: 'Sujet non trouvé' }, { status: 404 })
      }
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

// PUT /api/forum/topics/[id] - Edit topic (author only)
export async function PUT(
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
    const body = await request.json()
    const { title, content } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le titre est requis' },
        { status: 400 }
      )
    }

    if (title.trim().length > 200) {
      return NextResponse.json(
        { error: 'Le titre ne peut pas dépasser 200 caractères' },
        { status: 400 }
      )
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le contenu est requis' },
        { status: 400 }
      )
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: 'Le contenu ne peut pas dépasser 10 000 caractères' },
        { status: 400 }
      )
    }

    const topic = await db.topic.findUnique({
      where: { id: topicId },
    })

    if (!topic) {
      return NextResponse.json({ error: 'Sujet non trouvé' }, { status: 404 })
    }

    // Only author can edit their own topic
    if (topic.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez modifier que vos propres sujets' },
        { status: 403 }
      )
    }

    const updatedTopic = await db.topic.update({
      where: { id: topicId },
      data: {
        title: title.trim(),
        content: content.trim(),
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true },
        },
        category: true,
      },
    })

    return NextResponse.json({ topic: updatedTopic })
  } catch (error) {
    console.error('Error editing topic:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification du sujet' },
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

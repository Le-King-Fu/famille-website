import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseMentions } from '@/lib/mentions'

// POST /api/forum/topics - Create a new topic
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Block CHILD role from forum
  if (session.user.role === 'CHILD') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.categoryId || typeof body.categoryId !== 'string') {
      return NextResponse.json(
        { error: 'La catégorie est requise' },
        { status: 400 }
      )
    }

    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le titre est requis' },
        { status: 400 }
      )
    }

    if (body.title.length > 200) {
      return NextResponse.json(
        { error: 'Le titre ne peut pas dépasser 200 caractères' },
        { status: 400 }
      )
    }

    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le contenu est requis' },
        { status: 400 }
      )
    }

    if (body.content.length > 10000) {
      return NextResponse.json(
        { error: 'Le contenu ne peut pas dépasser 10000 caractères' },
        { status: 400 }
      )
    }

    // Verify category exists
    const category = await db.forumCategory.findUnique({
      where: { id: body.categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Catégorie non trouvée' },
        { status: 404 }
      )
    }

    // Create topic
    const topic = await db.topic.create({
      data: {
        title: body.title.trim(),
        content: body.content.trim(),
        categoryId: body.categoryId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        category: true,
      },
    })

    // Mark topic as read for the author
    await db.topicRead.create({
      data: {
        userId: session.user.id,
        topicId: topic.id,
        lastReadAt: new Date(),
      },
    })

    // Create notifications for mentioned users
    const topicLink = `/forum/${body.categoryId}/${topic.id}`
    const mentionedUsers = await parseMentions(body.content.trim())

    if (mentionedUsers.length > 0) {
      await db.notification.createMany({
        data: mentionedUsers
          .filter((user) => user.id !== session.user.id) // Don't notify self
          .map((user) => ({
            type: 'MENTION' as const,
            userId: user.id,
            message: `${topic.author.firstName} vous a mentionné dans "${topic.title}"`,
            link: topicLink,
            createdById: session.user.id,
            topicId: topic.id,
          })),
      })
    }

    return NextResponse.json({ topic }, { status: 201 })
  } catch (error) {
    console.error('Error creating topic:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du sujet' },
      { status: 500 }
    )
  }
}

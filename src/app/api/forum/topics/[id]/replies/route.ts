import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseMentions } from '@/lib/mentions'

// POST /api/forum/topics/[id]/replies - Add a reply to a topic
export async function POST(
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
    const body = await request.json()

    // Validate content
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

    // Verify topic exists and get author info
    const topic = await db.topic.findUnique({
      where: { id: topicId },
      include: {
        category: { select: { id: true } },
      },
    })

    if (!topic) {
      return NextResponse.json({ error: 'Sujet non trouvé' }, { status: 404 })
    }

    // Validate quoted reply if provided
    let quotedReplyAuthorId: string | null = null
    if (body.quotedReplyId) {
      const quotedReply = await db.reply.findUnique({
        where: { id: body.quotedReplyId },
      })

      if (!quotedReply || quotedReply.topicId !== topicId) {
        return NextResponse.json(
          { error: 'Réponse citée invalide' },
          { status: 400 }
        )
      }
      quotedReplyAuthorId = quotedReply.authorId
    }

    // Create reply and update topic's lastReplyAt
    const [reply] = await db.$transaction([
      db.reply.create({
        data: {
          content: body.content.trim(),
          topicId,
          authorId: session.user.id,
          quotedReplyId: body.quotedReplyId || null,
        },
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
      }),
      db.topic.update({
        where: { id: topicId },
        data: { lastReplyAt: new Date() },
      }),
    ])

    // Create notifications (async, don't block response)
    const topicLink = `/forum/${topic.category.id}/${topicId}`
    const notificationsToCreate: {
      type: 'MENTION' | 'QUOTE' | 'TOPIC_REPLY'
      userId: string
      message: string
    }[] = []

    // 1. Notify quoted reply author (if not self)
    if (quotedReplyAuthorId && quotedReplyAuthorId !== session.user.id) {
      notificationsToCreate.push({
        type: 'QUOTE',
        userId: quotedReplyAuthorId,
        message: `${reply.author.firstName} a cité votre réponse`,
      })
    }

    // 2. Notify mentioned users
    const mentionedUsers = await parseMentions(body.content.trim())
    for (const user of mentionedUsers) {
      // Don't notify self or already notified users
      if (user.id !== session.user.id && user.id !== quotedReplyAuthorId) {
        notificationsToCreate.push({
          type: 'MENTION',
          userId: user.id,
          message: `${reply.author.firstName} vous a mentionné`,
        })
      }
    }

    // Create all notifications
    if (notificationsToCreate.length > 0) {
      await db.notification.createMany({
        data: notificationsToCreate.map((n) => ({
          type: n.type,
          userId: n.userId,
          message: n.message,
          link: topicLink,
          createdById: session.user.id,
          topicId,
          replyId: reply.id,
        })),
      })
    }

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    console.error('Error creating reply:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la réponse' },
      { status: 500 }
    )
  }
}

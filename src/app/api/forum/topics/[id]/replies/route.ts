import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseMentions } from '@/lib/mentions'
import { sendPushNotifications } from '@/lib/push'
import { sendEmailNotifications } from '@/lib/email'

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
        event: {
          select: {
            hiddenFrom: { select: { userId: true } },
          },
        },
      },
    })

    if (!topic) {
      return NextResponse.json({ error: 'Sujet non trouvé' }, { status: 404 })
    }

    // Check if topic is linked to an event hidden from this user
    if (session.user.role !== 'ADMIN' && topic.event?.hiddenFrom.some((h) => h.userId === session.user.id)) {
      return NextResponse.json({ error: 'Sujet non trouvé' }, { status: 404 })
    }

    // Collect hidden user IDs so we don't notify them
    const hiddenUserIds = new Set(topic.event?.hiddenFrom.map((h) => h.userId) ?? [])

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
      }),
      db.topic.update({
        where: { id: topicId },
        data: { lastReplyAt: new Date() },
      }),
    ])

    // Mark topic as read for the reply author
    await db.topicRead.upsert({
      where: {
        userId_topicId: {
          userId: session.user.id,
          topicId,
        },
      },
      create: {
        userId: session.user.id,
        topicId,
        lastReadAt: new Date(),
      },
      update: {
        lastReadAt: new Date(),
      },
    })

    // Create notifications (async, don't block response)
    const topicLink = `/forum/${topic.category.id}/${topicId}`
    const notificationsToCreate: {
      type: 'MENTION' | 'QUOTE' | 'TOPIC_REPLY'
      userId: string
      message: string
    }[] = []

    // 1. Notify quoted reply author (if not self, and not hidden from event)
    if (quotedReplyAuthorId && quotedReplyAuthorId !== session.user.id && !hiddenUserIds.has(quotedReplyAuthorId)) {
      notificationsToCreate.push({
        type: 'QUOTE',
        userId: quotedReplyAuthorId,
        message: `${reply.author.firstName} a cité votre réponse`,
      })
    }

    // 2. Notify mentioned users (skip hidden users)
    const mentionedUsers = await parseMentions(body.content.trim())
    for (const user of mentionedUsers) {
      // Don't notify self, already notified users, or hidden users
      if (user.id !== session.user.id && user.id !== quotedReplyAuthorId && !hiddenUserIds.has(user.id)) {
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

      // Send push notifications (fire-and-forget)
      const quoteUserIds = notificationsToCreate
        .filter((n) => n.type === 'QUOTE')
        .map((n) => n.userId)
      const mentionUserIds = notificationsToCreate
        .filter((n) => n.type === 'MENTION')
        .map((n) => n.userId)

      if (quoteUserIds.length > 0) {
        sendPushNotifications(quoteUserIds, 'QUOTE', {
          title: 'Citation',
          body: `${reply.author.firstName} a cité votre réponse`,
          url: topicLink,
          tag: `quote-${reply.id}`,
        })

        sendEmailNotifications(quoteUserIds, 'QUOTE', {
          subject: 'Votre réponse a été citée',
          body: `${reply.author.firstName} a cité votre réponse dans le forum`,
          url: topicLink,
        })
      }
      if (mentionUserIds.length > 0) {
        sendPushNotifications(mentionUserIds, 'MENTION', {
          title: 'Mention',
          body: `${reply.author.firstName} vous a mentionné`,
          url: topicLink,
          tag: `mention-${reply.id}`,
        })

        sendEmailNotifications(mentionUserIds, 'MENTION', {
          subject: 'Vous avez été mentionné',
          body: `${reply.author.firstName} vous a mentionné dans le forum`,
          url: topicLink,
        })
      }
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

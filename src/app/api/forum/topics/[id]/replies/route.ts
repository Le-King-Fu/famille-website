import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

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

    // Verify topic exists
    const topic = await db.topic.findUnique({
      where: { id: topicId },
    })

    if (!topic) {
      return NextResponse.json({ error: 'Sujet non trouvé' }, { status: 404 })
    }

    // Validate quoted reply if provided
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

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    console.error('Error creating reply:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la réponse' },
      { status: 500 }
    )
  }
}

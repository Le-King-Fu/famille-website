import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉']

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { emoji, topicId, replyId, photoCommentId } = body

    // Validate emoji
    if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
      return NextResponse.json(
        { error: 'Emoji non valide' },
        { status: 400 }
      )
    }

    // Validate exactly one target
    const targets = [topicId, replyId, photoCommentId].filter(Boolean)
    if (targets.length !== 1) {
      return NextResponse.json(
        { error: 'Exactement une cible requise (topicId, replyId, ou photoCommentId)' },
        { status: 400 }
      )
    }

    // Check if reaction already exists (toggle logic)
    const existing = await db.reaction.findFirst({
      where: {
        userId: session.user.id,
        emoji,
        topicId: topicId || null,
        replyId: replyId || null,
        photoCommentId: photoCommentId || null,
      },
    })

    if (existing) {
      // Toggle off - delete the reaction
      await db.reaction.delete({
        where: { id: existing.id },
      })
      return NextResponse.json({ action: 'removed', reactionId: existing.id })
    }

    // Toggle on - create the reaction
    const reaction = await db.reaction.create({
      data: {
        emoji,
        userId: session.user.id,
        topicId: topicId || null,
        replyId: replyId || null,
        photoCommentId: photoCommentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({ action: 'added', reaction })
  } catch (error) {
    console.error('Error toggling reaction:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la réaction' },
      { status: 500 }
    )
  }
}

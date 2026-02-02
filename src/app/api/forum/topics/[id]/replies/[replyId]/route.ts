import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// PUT /api/forum/topics/[id]/replies/[replyId] - Edit a reply
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; replyId: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (session.user.role === 'CHILD') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const { id: topicId, replyId } = await params

  try {
    const body = await request.json()
    const { content } = body

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

    const reply = await db.reply.findUnique({
      where: { id: replyId },
    })

    if (!reply) {
      return NextResponse.json({ error: 'Réponse non trouvée' }, { status: 404 })
    }

    if (reply.topicId !== topicId) {
      return NextResponse.json({ error: 'Réponse invalide' }, { status: 400 })
    }

    // Only author can edit their own message
    if (reply.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez modifier que vos propres messages' },
        { status: 403 }
      )
    }

    // Save current content to history and update reply in a transaction
    const updatedReply = await db.$transaction(async (tx) => {
      // Save previous version to history
      await tx.replyHistory.create({
        data: {
          content: reply.content,
          replyId: reply.id,
        },
      })

      // Update reply with new content
      return tx.reply.update({
        where: { id: replyId },
        data: {
          content: content.trim(),
          isEdited: true,
          editedAt: new Date(),
        },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true },
          },
          quotedReply: {
            select: {
              id: true,
              content: true,
              author: { select: { id: true, firstName: true } },
            },
          },
        },
      })
    })

    return NextResponse.json(updatedReply)
  } catch (error) {
    console.error('Error editing reply:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification de la réponse' },
      { status: 500 }
    )
  }
}

// DELETE /api/forum/topics/[id]/replies/[replyId] - Delete a reply
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; replyId: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (session.user.role === 'CHILD') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const { id: topicId, replyId } = await params

  try {
    const reply = await db.reply.findUnique({
      where: { id: replyId },
    })

    if (!reply) {
      return NextResponse.json({ error: 'Réponse non trouvée' }, { status: 404 })
    }

    if (reply.topicId !== topicId) {
      return NextResponse.json({ error: 'Réponse invalide' }, { status: 400 })
    }

    // Only admin or author can delete
    if (session.user.role !== 'ADMIN' && reply.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer cette réponse' },
        { status: 403 }
      )
    }

    await db.reply.delete({
      where: { id: replyId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reply:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la réponse' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

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

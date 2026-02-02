import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/forum/topics/[id]/replies/[replyId]/history - Get reply edit history
export async function GET(
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
      select: { topicId: true },
    })

    if (!reply) {
      return NextResponse.json({ error: 'Réponse non trouvée' }, { status: 404 })
    }

    if (reply.topicId !== topicId) {
      return NextResponse.json({ error: 'Réponse invalide' }, { status: 400 })
    }

    const history = await db.replyHistory.findMany({
      where: { replyId },
      orderBy: { editedAt: 'desc' },
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching reply history:', error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique" },
      { status: 500 }
    )
  }
}

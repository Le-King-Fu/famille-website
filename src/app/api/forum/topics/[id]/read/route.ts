import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/forum/topics/[id]/read - Mark topic as read
export async function POST(
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
    // Verify topic exists
    const topic = await db.topic.findUnique({
      where: { id: topicId },
    })

    if (!topic) {
      return NextResponse.json({ error: 'Sujet non trouvé' }, { status: 404 })
    }

    // Upsert the read record
    const topicRead = await db.topicRead.upsert({
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

    return NextResponse.json({ success: true, topicRead })
  } catch (error) {
    console.error('Error marking topic as read:', error)
    return NextResponse.json(
      { error: 'Erreur lors du marquage comme lu' },
      { status: 500 }
    )
  }
}

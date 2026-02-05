import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/forum/unread-count - Get count of unread topics for the current user
export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (session.user.role === 'CHILD') {
    return NextResponse.json({ count: 0 })
  }

  const userId = session.user.id

  try {
    // Get all topics with their last activity and user's read status
    const topics = await db.topic.findMany({
      select: {
        id: true,
        lastReplyAt: true,
        reads: {
          where: { userId },
          select: { lastReadAt: true },
        },
      },
    })

    // Count topics that are unread
    const unreadCount = topics.filter((topic) => {
      const userRead = topic.reads[0]
      if (!userRead) return true // Never read
      return new Date(topic.lastReplyAt) > new Date(userRead.lastReadAt)
    }).length

    return NextResponse.json({ count: unreadCount })
  } catch (error) {
    console.error('Error counting unread topics:', error)
    return NextResponse.json(
      { error: 'Erreur lors du comptage des non-lus' },
      { status: 500 }
    )
  }
}

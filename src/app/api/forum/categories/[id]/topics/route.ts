import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { topicVisibilityFilter } from '@/lib/event-visibility'

// GET /api/forum/categories/[id]/topics - List topics in a category
export async function GET(
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

  const { id: categoryId } = await params
  const userId = session.user.id

  try {
    // Verify category exists
    const category = await db.forumCategory.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
    }

    // Get pagination params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get topics with reply count and last reply info
    const isAdmin = session.user.role === 'ADMIN'
    const topicWhere = { categoryId, ...topicVisibilityFilter(userId, isAdmin) }
    const [topics, total] = await Promise.all([
      db.topic.findMany({
        where: topicWhere,
        orderBy: [
          { isPinned: 'desc' },
          { lastReplyAt: 'desc' },
        ],
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: { replies: true },
          },
          replies: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                },
              },
            },
          },
          reads: {
            where: { userId },
            select: { lastReadAt: true },
          },
        },
      }),
      db.topic.count({ where: topicWhere }),
    ])

    // Calculate unread status for each topic
    const topicsWithReadStatus = await Promise.all(
      topics.map(async (topic) => {
        const userRead = topic.reads[0]
        const lastReadAt = userRead?.lastReadAt

        // Topic is unread if never read or if there's activity since last read
        const isUnread = !lastReadAt || new Date(topic.lastReplyAt) > new Date(lastReadAt)

        // Count unread replies
        let unreadRepliesCount = 0
        if (lastReadAt) {
          unreadRepliesCount = await db.reply.count({
            where: {
              topicId: topic.id,
              createdAt: { gt: lastReadAt },
            },
          })
        } else {
          // If never read, all replies + topic itself are unread
          unreadRepliesCount = topic._count.replies
        }

        // Remove reads from response (internal use only)
        const { reads, ...topicWithoutReads } = topic

        return {
          ...topicWithoutReads,
          isUnread,
          unreadRepliesCount,
        }
      })
    )

    return NextResponse.json({
      category,
      topics: topicsWithReadStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching topics:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sujets' },
      { status: 500 }
    )
  }
}

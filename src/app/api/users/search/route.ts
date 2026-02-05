import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/users/search?q=query - Search users for @mention autocomplete
export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')?.toLowerCase().trim() || ''

  if (query.length < 1) {
    return NextResponse.json({ users: [] })
  }

  try {
    // Search all active users (including admins and self), excluding only CHILD role
    const users = await db.user.findMany({
      where: {
        isActive: true,
        role: { not: 'CHILD' }, // Children can't use forum
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
      take: 5,
      orderBy: { firstName: 'asc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    )
  }
}

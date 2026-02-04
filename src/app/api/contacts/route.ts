import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/contacts - List all active members with contact info
export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const contacts = await db.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        avatarUrl: true,
      },
      orderBy: { lastName: 'asc' },
    })

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des contacts' },
      { status: 500 }
    )
  }
}

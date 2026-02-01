import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/users/[id] - Get user details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const { id } = await params

  try {
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            photos: true,
            topics: true,
            replies: true,
            albums: true,
            events: true,
            gameScores: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'utilisateur' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/users/[id] - Update user role/name/status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const { id } = await params

  // Prevent self-modification for role and isActive
  if (id === session.user.id) {
    const body = await request.json()
    if ('role' in body || 'isActive' in body) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas modifier votre propre rôle ou statut' },
        { status: 400 }
      )
    }
  }

  try {
    const body = await request.json()
    const updateData: {
      firstName?: string
      lastName?: string
      role?: 'ADMIN' | 'MEMBER' | 'CHILD'
      isActive?: boolean
    } = {}

    if (body.firstName && typeof body.firstName === 'string') {
      updateData.firstName = body.firstName.trim()
    }

    if (body.lastName && typeof body.lastName === 'string') {
      updateData.lastName = body.lastName.trim()
    }

    if (body.role && ['ADMIN', 'MEMBER', 'CHILD'].includes(body.role)) {
      updateData.role = body.role
    }

    if (typeof body.isActive === 'boolean') {
      updateData.isActive = body.isActive
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée valide à mettre à jour' },
        { status: 400 }
      )
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'utilisateur' },
      { status: 500 }
    )
  }
}

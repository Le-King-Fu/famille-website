import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/users/me - Get current user profile
export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            gameScores: true,
            topics: true,
            replies: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    )
  }
}

// PUT /api/users/me - Update current user profile
export async function PUT(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const updateData: {
      email?: string
      firstName?: string
      lastName?: string
    } = {}

    // Handle email update with uniqueness check
    if (body.email && typeof body.email === 'string') {
      const newEmail = body.email.trim().toLowerCase()

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newEmail)) {
        return NextResponse.json(
          { error: 'Format d\'email invalide' },
          { status: 400 }
        )
      }

      // Check if email already exists for another user
      const existingUser = await db.user.findUnique({
        where: { email: newEmail },
        select: { id: true },
      })

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé par un autre compte' },
          { status: 400 }
        )
      }

      updateData.email = newEmail
    }

    if (body.firstName && typeof body.firstName === 'string') {
      const firstName = body.firstName.trim()
      if (firstName.length < 1) {
        return NextResponse.json(
          { error: 'Le prénom est requis' },
          { status: 400 }
        )
      }
      updateData.firstName = firstName
    }

    if (body.lastName && typeof body.lastName === 'string') {
      const lastName = body.lastName.trim()
      if (lastName.length < 1) {
        return NextResponse.json(
          { error: 'Le nom est requis' },
          { status: 400 }
        )
      }
      updateData.lastName = lastName
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée valide à mettre à jour' },
        { status: 400 }
      )
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}

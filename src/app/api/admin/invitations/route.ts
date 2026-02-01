import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import crypto from 'crypto'

// GET /api/admin/invitations - List all invitation codes
export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')

  try {
    const now = new Date()

    // Build where clause based on status filter
    let whereClause = {}
    if (status === 'active') {
      whereClause = {
        isUsed: false,
        expiresAt: { gt: now },
      }
    } else if (status === 'used') {
      whereClause = { isUsed: true }
    } else if (status === 'expired') {
      whereClause = {
        isUsed: false,
        expiresAt: { lte: now },
      }
    }

    const invitations = await db.invitationCode.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        usedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Add computed status to each invitation
    const invitationsWithStatus = invitations.map((inv) => ({
      ...inv,
      status: inv.isUsed ? 'used' : inv.expiresAt <= now ? 'expired' : 'active',
    }))

    return NextResponse.json({ invitations: invitationsWithStatus })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des invitations' },
      { status: 500 }
    )
  }
}

// POST /api/admin/invitations - Create a new invitation code
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  try {
    const body = await request.json()

    // Default to 7 days if not specified
    const days = body.expirationDays || 7
    if (![7, 14, 30, 90].includes(days)) {
      return NextResponse.json(
        { error: 'Durée de validité invalide' },
        { status: 400 }
      )
    }

    // Generate unique 8-character code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)

    const invitation = await db.invitationCode.create({
      data: {
        code,
        expiresAt,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        invitation: {
          ...invitation,
          status: 'active',
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'invitation' },
      { status: 500 }
    )
  }
}

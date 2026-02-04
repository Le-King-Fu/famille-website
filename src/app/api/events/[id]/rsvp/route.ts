import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { RsvpStatus } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/events/[id]/rsvp - Set or update user's RSVP status
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // CHILD cannot RSVP
  if (session.user.role === 'CHILD') {
    return NextResponse.json(
      { error: 'Permission refusée' },
      { status: 403 }
    )
  }

  const { id } = await params

  try {
    // Verify event exists
    const event = await db.event.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Validate status
    if (!body.status || !Object.values(RsvpStatus).includes(body.status)) {
      return NextResponse.json(
        { error: 'Statut invalide. Utilisez ATTENDING, MAYBE ou NOT_ATTENDING' },
        { status: 400 }
      )
    }

    // Upsert RSVP
    const rsvp = await db.eventRsvp.upsert({
      where: {
        eventId_userId: {
          eventId: id,
          userId: session.user.id,
        },
      },
      update: {
        status: body.status,
      },
      create: {
        eventId: id,
        userId: session.user.id,
        status: body.status,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({ rsvp })
  } catch (error) {
    console.error('Error setting RSVP:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la participation' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id]/rsvp - Remove user's RSVP
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // CHILD cannot manage RSVPs
  if (session.user.role === 'CHILD') {
    return NextResponse.json(
      { error: 'Permission refusée' },
      { status: 403 }
    )
  }

  const { id } = await params

  try {
    // Check if RSVP exists
    const existingRsvp = await db.eventRsvp.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId: session.user.id,
        },
      },
    })

    if (!existingRsvp) {
      return NextResponse.json(
        { error: 'Participation non trouvée' },
        { status: 404 }
      )
    }

    await db.eventRsvp.delete({
      where: {
        eventId_userId: {
          eventId: id,
          userId: session.user.id,
        },
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting RSVP:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la participation' },
      { status: 500 }
    )
  }
}

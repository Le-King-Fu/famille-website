import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { EventCategory } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/events/[id] - Get single event
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id } = await params

  try {
    const event = await db.event.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
        rsvps: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        hiddenFrom: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // If user is in hiddenFrom and not admin, return 404
    const isAdmin = session.user.role === 'ADMIN'
    const isHidden = event.hiddenFrom.some((h) => h.userId === session.user.id)
    if (isHidden && !isAdmin) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Only expose hiddenFrom to creator/admin
    const isCreator = event.createdById === session.user.id
    if (!isAdmin && !isCreator) {
      const { hiddenFrom, ...rest } = event
      return NextResponse.json({ event: rest })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'événement' },
      { status: 500 }
    )
  }
}

// PUT /api/events/[id] - Update event
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Fetch existing event
    const existingEvent = await db.event.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Check permission: creator or admin only
    const isCreator = existingEvent.createdById === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission refusée' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = {}

    // Validate and set title
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Le titre ne peut pas être vide' },
          { status: 400 }
        )
      }
      if (body.title.length > 100) {
        return NextResponse.json(
          { error: 'Le titre ne peut pas dépasser 100 caractères' },
          { status: 400 }
        )
      }
      updateData.title = body.title.trim()
    }

    // Validate and set description
    if (body.description !== undefined) {
      if (body.description && body.description.length > 500) {
        return NextResponse.json(
          { error: 'La description ne peut pas dépasser 500 caractères' },
          { status: 400 }
        )
      }
      updateData.description = body.description?.trim() || null
    }

    // Validate dates
    let startDate = existingEvent.startDate
    if (body.startDate !== undefined) {
      startDate = new Date(body.startDate)
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'Format de date de début invalide' },
          { status: 400 }
        )
      }
      updateData.startDate = startDate
    }

    if (body.endDate !== undefined) {
      if (body.endDate === null) {
        updateData.endDate = null
      } else {
        const endDate = new Date(body.endDate)
        if (isNaN(endDate.getTime())) {
          return NextResponse.json(
            { error: 'Format de date de fin invalide' },
            { status: 400 }
          )
        }
        if (endDate < startDate) {
          return NextResponse.json(
            { error: 'La date de fin doit être après la date de début' },
            { status: 400 }
          )
        }
        updateData.endDate = endDate
      }
    }

    // Validate allDay
    if (body.allDay !== undefined) {
      updateData.allDay = Boolean(body.allDay)
    }

    // Validate category
    if (body.category !== undefined) {
      if (!Object.values(EventCategory).includes(body.category)) {
        return NextResponse.json(
          { error: 'Catégorie invalide' },
          { status: 400 }
        )
      }
      updateData.category = body.category
    }

    // Validate color
    if (body.color !== undefined) {
      if (body.color === null) {
        updateData.color = null
      } else if (!/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
        return NextResponse.json(
          { error: 'Format de couleur invalide (utilisez #RRGGBB)' },
          { status: 400 }
        )
      } else {
        updateData.color = body.color
      }
    }

    // Validate imageUrl - only ADMIN can modify
    if (body.imageUrl !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Seul un administrateur peut modifier l\'image' },
          { status: 403 }
        )
      }
      updateData.imageUrl = body.imageUrl || null
    }

    // Set recurrence
    if (body.recurrence !== undefined) {
      updateData.recurrence = body.recurrence
    }

    // Validate and set location
    if (body.location !== undefined) {
      if (body.location === null) {
        updateData.location = null
      } else {
        if (body.location.length > 200) {
          return NextResponse.json(
            { error: 'Le lieu ne peut pas dépasser 200 caractères' },
            { status: 400 }
          )
        }
        updateData.location = body.location.trim() || null
      }
    }

    // Handle hiddenFromUserIds update
    if (body.hiddenFromUserIds !== undefined) {
      const hiddenFromUserIds: string[] = Array.isArray(body.hiddenFromUserIds)
        ? body.hiddenFromUserIds.filter((uid: string) => typeof uid === 'string' && uid !== session.user.id)
        : []

      // Delete-and-recreate in a transaction
      await db.$transaction([
        db.eventHiddenFrom.deleteMany({ where: { eventId: id } }),
        ...hiddenFromUserIds.map((userId: string) =>
          db.eventHiddenFrom.create({ data: { eventId: id, userId } })
        ),
      ])
    }

    const event = await db.event.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        topic: {
          select: {
            id: true,
            title: true,
          },
        },
        rsvps: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        hiddenFrom: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'événement' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id] - Delete event
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Fetch existing event
    const existingEvent = await db.event.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      )
    }

    // Check permission: creator or admin only
    const isCreator = existingEvent.createdById === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission refusée' },
        { status: 403 }
      )
    }

    await db.event.delete({
      where: { id },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'événement' },
      { status: 500 }
    )
  }
}

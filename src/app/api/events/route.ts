import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { expandEvents, RecurrenceRule } from '@/lib/recurrence'
import { EventCategory, Prisma } from '@prisma/client'

// GET /api/events - List events in date range
export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const startParam = searchParams.get('start')
  const endParam = searchParams.get('end')
  const category = searchParams.get('category')

  if (!startParam || !endParam) {
    return NextResponse.json(
      { error: 'Les paramètres start et end sont requis' },
      { status: 400 }
    )
  }

  const rangeStart = new Date(startParam)
  const rangeEnd = new Date(endParam)

  if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
    return NextResponse.json(
      { error: 'Format de date invalide' },
      { status: 400 }
    )
  }

  try {
    // Build the where clause
    const where: Prisma.EventWhereInput = {
      OR: [
        // Non-recurring events that start before the range ends
        {
          recurrence: { equals: Prisma.DbNull },
          startDate: { lte: rangeEnd },
        },
        // Recurring events (we need all of them to expand occurrences)
        {
          NOT: { recurrence: { equals: Prisma.DbNull } },
        },
      ],
    }

    // Add category filter if specified
    if (category && Object.values(EventCategory).includes(category as EventCategory)) {
      where.category = category as EventCategory
    }

    const events = await db.event.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
      },
      orderBy: { startDate: 'asc' },
    })

    // Expand recurring events
    const expandedEvents = expandEvents(
      events.map((e) => ({
        ...e,
        recurrence: e.recurrence as RecurrenceRule | null,
      })),
      rangeStart,
      rangeEnd
    )

    // Sort by start date
    expandedEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

    return NextResponse.json({ events: expandedEvents })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des événements' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Check role - CHILD cannot create events
  if (session.user.role === 'CHILD') {
    return NextResponse.json(
      { error: 'Permission refusée' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le titre est requis' },
        { status: 400 }
      )
    }

    if (body.title.length > 100) {
      return NextResponse.json(
        { error: 'Le titre ne peut pas dépasser 100 caractères' },
        { status: 400 }
      )
    }

    if (!body.startDate) {
      return NextResponse.json(
        { error: 'La date de début est requise' },
        { status: 400 }
      )
    }

    const startDate = new Date(body.startDate)
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Format de date de début invalide' },
        { status: 400 }
      )
    }

    let endDate: Date | null = null
    if (body.endDate) {
      endDate = new Date(body.endDate)
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
    }

    // Validate category
    let category: EventCategory = EventCategory.OTHER
    if (body.category) {
      if (!Object.values(EventCategory).includes(body.category)) {
        return NextResponse.json(
          { error: 'Catégorie invalide' },
          { status: 400 }
        )
      }
      category = body.category
    }

    // Validate color format
    if (body.color && !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
      return NextResponse.json(
        { error: 'Format de couleur invalide (utilisez #RRGGBB)' },
        { status: 400 }
      )
    }

    // Check imageUrl permission - only ADMIN can set
    if (body.imageUrl && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seul un administrateur peut ajouter une image' },
        { status: 403 }
      )
    }

    // Validate description length
    if (body.description && body.description.length > 500) {
      return NextResponse.json(
        { error: 'La description ne peut pas dépasser 500 caractères' },
        { status: 400 }
      )
    }

    // Validate location length
    if (body.location && body.location.length > 200) {
      return NextResponse.json(
        { error: 'Le lieu ne peut pas dépasser 200 caractères' },
        { status: 400 }
      )
    }

    // Create forum topic if requested (MEMBER and ADMIN only, not CHILD)
    let topicId: string | null = null
    if (body.createForumTopic) {
      const topic = await db.topic.create({
        data: {
          title: `Discussion: ${body.title.trim()}`,
          content: `Discussion associée à l'événement "${body.title.trim()}".\n\n${body.description?.trim() || 'Aucune description.'}`,
          categoryId: 'cml7vw67400009qxso9ccq098', // Forum category for events
          authorId: session.user.id,
        },
      })
      topicId = topic.id
    }

    const event = await db.event.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || null,
        startDate,
        endDate,
        allDay: body.allDay ?? false,
        category,
        color: body.color || null,
        imageUrl: body.imageUrl || null,
        recurrence: body.recurrence || null,
        location: body.location?.trim() || null,
        topicId,
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
        topic: true,
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
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'événement' },
      { status: 500 }
    )
  }
}

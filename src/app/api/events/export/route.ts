import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { format } from 'date-fns'
import { EventCategory } from '@prisma/client'
import { generateICalHeader, generateICalFooter, generateEventVEvent } from '@/lib/ical'

// GET /api/events/export - Export events as iCal
export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const startParam = searchParams.get('start')
  const endParam = searchParams.get('end')
  const category = searchParams.get('category')

  try {
    // Build query
    const where: Record<string, unknown> = {}

    if (startParam && endParam) {
      const rangeStart = new Date(startParam)
      const rangeEnd = new Date(endParam)

      if (!isNaN(rangeStart.getTime()) && !isNaN(rangeEnd.getTime())) {
        where.startDate = {
          gte: rangeStart,
          lte: rangeEnd,
        }
      }
    }

    if (category && Object.values(EventCategory).includes(category as EventCategory)) {
      where.category = category
    }

    const events = await db.event.findMany({
      where,
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    // Generate iCal content using shared utilities
    const lines: string[] = [
      ...generateICalHeader(),
    ]

    for (const event of events) {
      lines.push(...generateEventVEvent(event))
    }

    lines.push(...generateICalFooter())

    const icalContent = lines.join('\r\n')

    // Generate filename with date
    const today = format(new Date(), 'yyyy-MM-dd')
    const filename = `calendrier-familial-${today}.ics`

    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting events:', error)
    return NextResponse.json(
      { error: "Erreur lors de l'export des événements" },
      { status: 500 }
    )
  }
}

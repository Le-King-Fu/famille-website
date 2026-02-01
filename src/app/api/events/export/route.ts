import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { format } from 'date-fns'
import { EventCategory } from '@prisma/client'

// Format date for iCal (YYYYMMDD or YYYYMMDDTHHmmssZ)
function formatICalDate(date: Date, allDay: boolean): string {
  if (allDay) {
    return format(date, "yyyyMMdd")
  }
  // Convert to UTC
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

// Escape special characters in iCal text
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

// Fold long lines (iCal spec requires lines < 75 chars)
function foldLine(line: string): string {
  const maxLength = 75
  if (line.length <= maxLength) return line

  const result: string[] = []
  let remaining = line

  while (remaining.length > maxLength) {
    result.push(remaining.slice(0, maxLength))
    remaining = ' ' + remaining.slice(maxLength) // Continuation lines start with space
  }
  result.push(remaining)

  return result.join('\r\n')
}

// Category to French label mapping
const categoryLabels: Record<EventCategory, string> = {
  BIRTHDAY: 'Anniversaire',
  REUNION: 'Réunion',
  VACATION: 'Vacances',
  HOLIDAY: 'Fête',
  OTHER: 'Autre',
}

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

    // Generate iCal content
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Famille Website//Calendrier Familial//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Calendrier Familial',
      'X-WR-TIMEZONE:Europe/Paris',
    ]

    for (const event of events) {
      const uid = `${event.id}@famille-website`
      const created = formatICalDate(event.createdAt, false)
      const modified = formatICalDate(event.updatedAt, false)

      lines.push('BEGIN:VEVENT')
      lines.push(foldLine(`UID:${uid}`))
      lines.push(foldLine(`DTSTAMP:${created}`))
      lines.push(foldLine(`CREATED:${created}`))
      lines.push(foldLine(`LAST-MODIFIED:${modified}`))

      // Date handling
      if (event.allDay) {
        lines.push(foldLine(`DTSTART;VALUE=DATE:${formatICalDate(event.startDate, true)}`))
        if (event.endDate) {
          // iCal all-day events: end date is exclusive, so add one day
          const endDate = new Date(event.endDate)
          endDate.setDate(endDate.getDate() + 1)
          lines.push(foldLine(`DTEND;VALUE=DATE:${formatICalDate(endDate, true)}`))
        }
      } else {
        lines.push(foldLine(`DTSTART:${formatICalDate(event.startDate, false)}`))
        if (event.endDate) {
          lines.push(foldLine(`DTEND:${formatICalDate(event.endDate, false)}`))
        }
      }

      lines.push(foldLine(`SUMMARY:${escapeICalText(event.title)}`))

      if (event.description) {
        lines.push(foldLine(`DESCRIPTION:${escapeICalText(event.description)}`))
      }

      // Add category
      lines.push(foldLine(`CATEGORIES:${categoryLabels[event.category]}`))

      // Add organizer info
      const organizer = `${event.createdBy.firstName} ${event.createdBy.lastName}`
      lines.push(foldLine(`ORGANIZER;CN=${escapeICalText(organizer)}:mailto:noreply@famille-website.local`))

      lines.push('END:VEVENT')
    }

    lines.push('END:VCALENDAR')

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

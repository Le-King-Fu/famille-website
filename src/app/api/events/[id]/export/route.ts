import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { format } from 'date-fns'
import { generateEventICalContent } from '@/lib/ical'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper to generate URL-safe slug from title
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50)
}

// GET /api/events/[id]/export - Export single event as iCal
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
            firstName: true,
            lastName: true,
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

    // Generate iCal content
    const icalContent = generateEventICalContent(event)

    // Generate filename: evenement-{slug}-{date}.ics
    const slug = slugify(event.title)
    const dateStr = format(event.startDate, 'yyyy-MM-dd')
    const filename = `evenement-${slug}-${dateStr}.ics`

    return new NextResponse(icalContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting event:', error)
    return NextResponse.json(
      { error: "Erreur lors de l'export de l'événement" },
      { status: 500 }
    )
  }
}

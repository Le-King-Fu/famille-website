import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NotificationType } from '@prisma/client'

const ALL_TYPES = Object.values(NotificationType)

// GET /api/push/preferences - Get notification preferences
export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const preferences = await db.notificationPreference.findMany({
      where: { userId: session.user.id },
    })

    const prefMap = new Map(
      preferences.map((p) => [p.type, { pushEnabled: p.pushEnabled, emailEnabled: p.emailEnabled }])
    )

    // Return all types, defaulting to false (opt-in)
    const result = ALL_TYPES.map((type) => ({
      type,
      pushEnabled: prefMap.get(type)?.pushEnabled ?? false,
      emailEnabled: prefMap.get(type)?.emailEnabled ?? false,
    }))

    return NextResponse.json({ preferences: result })
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des préférences' },
      { status: 500 }
    )
  }
}

// PUT /api/push/preferences - Update notification preferences
export async function PUT(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (!Array.isArray(body.preferences)) {
      return NextResponse.json(
        { error: 'Format invalide' },
        { status: 400 }
      )
    }

    // Validate and upsert each preference
    const operations = body.preferences
      .filter(
        (p: { type: string; pushEnabled?: boolean; emailEnabled?: boolean }) =>
          ALL_TYPES.includes(p.type as NotificationType) &&
          (typeof p.pushEnabled === 'boolean' || typeof p.emailEnabled === 'boolean')
      )
      .map((p: { type: NotificationType; pushEnabled?: boolean; emailEnabled?: boolean }) => {
        const update: { pushEnabled?: boolean; emailEnabled?: boolean } = {}
        const create: { userId: string; type: NotificationType; pushEnabled?: boolean; emailEnabled?: boolean } = {
          userId: session.user.id,
          type: p.type,
        }
        if (typeof p.pushEnabled === 'boolean') {
          update.pushEnabled = p.pushEnabled
          create.pushEnabled = p.pushEnabled
        }
        if (typeof p.emailEnabled === 'boolean') {
          update.emailEnabled = p.emailEnabled
          create.emailEnabled = p.emailEnabled
        }
        return db.notificationPreference.upsert({
          where: {
            userId_type: {
              userId: session.user.id,
              type: p.type,
            },
          },
          update,
          create,
        })
      })

    await db.$transaction(operations)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating preferences:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour des préférences' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/push/subscribe - Save a push subscription
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json(
        { error: 'Données de souscription invalides' },
        { status: 400 }
      )
    }

    await db.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      update: {
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userId: session.user.id,
      },
      create: {
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Error saving push subscription:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde de la souscription' },
      { status: 500 }
    )
  }
}

// DELETE /api/push/subscribe - Remove a push subscription
export async function DELETE(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (!body.endpoint) {
      return NextResponse.json(
        { error: 'Endpoint requis' },
        { status: 400 }
      )
    }

    await db.pushSubscription.deleteMany({
      where: {
        endpoint: body.endpoint,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing push subscription:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la souscription' },
      { status: 500 }
    )
  }
}

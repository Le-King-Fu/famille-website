import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/photos/create - Create photo record after client-side upload
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
    const { albumId, url, caption } = body

    if (!albumId || !url) {
      return NextResponse.json(
        { error: 'albumId et url sont requis' },
        { status: 400 }
      )
    }

    // Verify album exists
    const album = await db.album.findUnique({
      where: { id: albumId },
    })

    if (!album) {
      return NextResponse.json({ error: 'Album non trouvé' }, { status: 404 })
    }

    // Create photo record
    const photo = await db.photo.create({
      data: {
        url,
        thumbnailUrl: url, // Use same URL for thumbnail
        caption: caption || null,
        albumId,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({ photo }, { status: 201 })
  } catch (error) {
    console.error('Error creating photo record:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la photo' },
      { status: 500 }
    )
  }
}

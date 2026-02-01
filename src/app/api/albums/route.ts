import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/albums - List all albums
export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const albums = await db.album.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { photos: true },
        },
        photos: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            thumbnailUrl: true,
          },
        },
      },
    })

    // Add cover photo URL to each album
    const albumsWithCover = albums.map((album) => ({
      ...album,
      coverUrl: album.photos[0]?.thumbnailUrl || null,
      photos: undefined,
    }))

    return NextResponse.json({ albums: albumsWithCover })
  } catch (error) {
    console.error('Error fetching albums:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des albums' },
      { status: 500 }
    )
  }
}

// POST /api/albums - Create album (admin only)
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

    if (body.description && body.description.length > 500) {
      return NextResponse.json(
        { error: 'La description ne peut pas dépasser 500 caractères' },
        { status: 400 }
      )
    }

    const album = await db.album.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || null,
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

    return NextResponse.json({ album }, { status: 201 })
  } catch (error) {
    console.error('Error creating album:', error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'album" },
      { status: 500 }
    )
  }
}

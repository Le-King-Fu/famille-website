import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/albums/[id] - Get album with photos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id: albumId } = await params

  try {
    const album = await db.album.findUnique({
      where: { id: albumId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        photos: {
          orderBy: { createdAt: 'asc' },
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: { comments: true },
            },
          },
        },
      },
    })

    if (!album) {
      return NextResponse.json({ error: 'Album non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ album })
  } catch (error) {
    console.error('Error fetching album:', error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'album" },
      { status: 500 }
    )
  }
}

// PUT /api/albums/[id] - Update album (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const { id: albumId } = await params

  try {
    const body = await request.json()

    const album = await db.album.findUnique({
      where: { id: albumId },
    })

    if (!album) {
      return NextResponse.json({ error: 'Album non trouvé' }, { status: 404 })
    }

    const updateData: Record<string, string | null> = {}

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
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
      updateData.title = body.title.trim()
    }

    if (body.description !== undefined) {
      if (body.description && body.description.length > 500) {
        return NextResponse.json(
          { error: 'La description ne peut pas dépasser 500 caractères' },
          { status: 400 }
        )
      }
      updateData.description = body.description?.trim() || null
    }

    if (body.coverPhotoId !== undefined) {
      updateData.coverPhotoId = body.coverPhotoId
    }

    const updatedAlbum = await db.album.update({
      where: { id: albumId },
      data: updateData,
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

    return NextResponse.json({ album: updatedAlbum })
  } catch (error) {
    console.error('Error updating album:', error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'album" },
      { status: 500 }
    )
  }
}

// DELETE /api/albums/[id] - Delete album and all photos (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
  }

  const { id: albumId } = await params

  try {
    const album = await db.album.findUnique({
      where: { id: albumId },
      include: {
        photos: {
          select: { url: true, thumbnailUrl: true },
        },
      },
    })

    if (!album) {
      return NextResponse.json({ error: 'Album non trouvé' }, { status: 404 })
    }

    // Delete photos from Supabase Storage
    if (album.photos.length > 0) {
      const filePaths = album.photos.flatMap((photo) => {
        const paths: string[] = []
        // Extract file path from URL
        const urlMatch = photo.url.match(/\/photos\/(.+)$/)
        if (urlMatch) paths.push(urlMatch[1])
        const thumbMatch = photo.thumbnailUrl.match(/\/photos\/(.+)$/)
        if (thumbMatch) paths.push(thumbMatch[1])
        return paths
      })

      if (filePaths.length > 0) {
        await supabaseAdmin.storage.from('photos').remove(filePaths)
      }
    }

    // Delete album (cascades to photos due to schema)
    await db.album.delete({
      where: { id: albumId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting album:', error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'album" },
      { status: 500 }
    )
  }
}

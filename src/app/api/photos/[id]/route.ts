import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/photos/[id] - Get photo details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { id: photoId } = await params

  try {
    const photo = await db.photo.findUnique({
      where: { id: photoId },
      include: {
        album: {
          select: {
            id: true,
            title: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
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

    if (!photo) {
      return NextResponse.json({ error: 'Photo non trouvée' }, { status: 404 })
    }

    return NextResponse.json({ photo })
  } catch (error) {
    console.error('Error fetching photo:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la photo' },
      { status: 500 }
    )
  }
}

// DELETE /api/photos/[id] - Delete photo (admin only)
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

  const { id: photoId } = await params

  try {
    const photo = await db.photo.findUnique({
      where: { id: photoId },
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo non trouvée' }, { status: 404 })
    }

    // Delete from Supabase Storage
    const filePaths: string[] = []
    const urlMatch = photo.url.match(/\/photos\/(.+)$/)
    if (urlMatch) filePaths.push(urlMatch[1])
    const thumbMatch = photo.thumbnailUrl.match(/\/photos\/(.+)$/)
    if (thumbMatch && thumbMatch[1] !== urlMatch?.[1]) {
      filePaths.push(thumbMatch[1])
    }

    if (filePaths.length > 0) {
      await supabaseAdmin.storage.from('photos').remove(filePaths)
    }

    // Delete from database
    await db.photo.delete({
      where: { id: photoId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la photo' },
      { status: 500 }
    )
  }
}

// PUT /api/photos/[id] - Update photo caption (admin only)
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

  const { id: photoId } = await params

  try {
    const body = await request.json()

    const photo = await db.photo.findUnique({
      where: { id: photoId },
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo non trouvée' }, { status: 404 })
    }

    const updatedPhoto = await db.photo.update({
      where: { id: photoId },
      data: {
        caption: body.caption?.trim() || null,
      },
    })

    return NextResponse.json({ photo: updatedPhoto })
  } catch (error) {
    console.error('Error updating photo:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la photo' },
      { status: 500 }
    )
  }
}

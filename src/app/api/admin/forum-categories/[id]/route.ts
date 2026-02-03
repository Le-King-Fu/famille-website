import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// PUT /api/admin/forum-categories/[id] - Update a forum category
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

  const { id } = await params

  try {
    const body = await request.json()
    const updateData: {
      name?: string
      description?: string | null
    } = {}

    if (body.name && typeof body.name === 'string') {
      updateData.name = body.name.trim()
    }

    if (typeof body.description === 'string') {
      updateData.description = body.description.trim() || null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée valide à mettre à jour' },
        { status: 400 }
      )
    }

    const category = await db.forumCategory.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { topics: true },
        },
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating forum category:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la catégorie' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/forum-categories/[id] - Delete a forum category
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

  const { id } = await params

  try {
    // Check if category exists and get topic count
    const category = await db.forumCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { topics: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 })
    }

    // Check for confirmDelete flag if topics exist
    const url = new URL(request.url)
    const confirmDelete = url.searchParams.get('confirm') === 'true'

    if (category._count.topics > 0 && !confirmDelete) {
      return NextResponse.json(
        {
          error: 'Cette catégorie contient des sujets',
          topicCount: category._count.topics,
          requiresConfirmation: true,
        },
        { status: 400 }
      )
    }

    // Delete all topics and replies first (cascade)
    await db.topic.deleteMany({
      where: { categoryId: id },
    })

    // Delete the category
    await db.forumCategory.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting forum category:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la catégorie' },
      { status: 500 }
    )
  }
}

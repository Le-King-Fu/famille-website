import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// PUT /api/admin/security-questions/[id] - Update a security question
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
      question?: string
      answer?: string
      isActive?: boolean
    } = {}

    if (body.question && typeof body.question === 'string') {
      updateData.question = body.question.trim()
    }

    if (body.answer && typeof body.answer === 'string') {
      updateData.answer = body.answer.trim().toLowerCase()
    }

    if (typeof body.isActive === 'boolean') {
      // If deactivating, check we'll still have at least 3 active questions
      if (body.isActive === false) {
        const activeCount = await db.securityQuestion.count({
          where: { isActive: true, id: { not: id } },
        })

        if (activeCount < 3) {
          return NextResponse.json(
            { error: 'Il doit y avoir au moins 3 questions de sécurité actives' },
            { status: 400 }
          )
        }
      }
      updateData.isActive = body.isActive
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée valide à mettre à jour' },
        { status: 400 }
      )
    }

    const question = await db.securityQuestion.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ question })
  } catch (error) {
    console.error('Error updating security question:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la question' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/security-questions/[id] - Delete a security question
export async function DELETE(
  _request: NextRequest,
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
    // Check if deleting would leave less than 3 active questions
    const question = await db.securityQuestion.findUnique({
      where: { id },
      select: { isActive: true },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question non trouvée' }, { status: 404 })
    }

    if (question.isActive) {
      const activeCount = await db.securityQuestion.count({
        where: { isActive: true },
      })

      if (activeCount <= 3) {
        return NextResponse.json(
          { error: 'Il doit y avoir au moins 3 questions de sécurité actives' },
          { status: 400 }
        )
      }
    }

    await db.securityQuestion.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting security question:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la question' },
      { status: 500 }
    )
  }
}

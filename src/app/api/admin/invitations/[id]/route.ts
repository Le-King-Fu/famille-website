import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// DELETE /api/admin/invitations/[id] - Revoke an unused invitation code
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
    const invitation = await db.invitationCode.findUnique({
      where: { id },
      select: { isUsed: true },
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation non trouvée' }, { status: 404 })
    }

    if (invitation.isUsed) {
      return NextResponse.json(
        { error: 'Impossible de révoquer une invitation déjà utilisée' },
        { status: 400 }
      )
    }

    await db.invitationCode.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking invitation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la révocation de l\'invitation' },
      { status: 500 }
    )
  }
}

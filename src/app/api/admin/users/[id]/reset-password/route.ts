import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// POST /api/admin/users/[id]/reset-password - Generate temporary password
export async function POST(
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
    // Check if user exists
    const user = await db.user.findUnique({
      where: { id },
      select: { id: true, email: true, firstName: true, lastName: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Generate temporary password (12 characters)
    const tempPassword = crypto.randomBytes(6).toString('base64').slice(0, 12)
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Update user with new password and require password change
    await db.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
    })

    return NextResponse.json({
      message: 'Mot de passe réinitialisé avec succès',
      tempPassword,
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 }
    )
  }
}

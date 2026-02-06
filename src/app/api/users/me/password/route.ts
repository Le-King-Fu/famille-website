import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// PUT /api/users/me/password - Change current user's password
export async function PUT(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Les mots de passe actuel et nouveau sont requis' },
        { status: 400 }
      )
    }

    // Get user with password
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 400 }
      )
    }

    // Validate new password
    const hasMinLength = newPassword.length >= 8
    const hasUppercase = /[A-Z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)

    if (!hasMinLength || !hasUppercase || !hasNumber) {
      return NextResponse.json(
        {
          error:
            'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre',
        },
        { status: 400 }
      )
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifié avec succès',
    })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      { error: 'Erreur lors du changement de mot de passe' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { invitationCode, firstName, lastName, email, password } =
      await request.json()

    // Vérifier le code d'invitation
    const invitation = await db.invitationCode.findUnique({
      where: { code: invitationCode.toUpperCase() },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Code d\'invitation invalide' },
        { status: 400 }
      )
    }

    if (invitation.isUsed) {
      return NextResponse.json(
        { error: 'Ce code d\'invitation a déjà été utilisé' },
        { status: 400 }
      )
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Ce code d\'invitation a expiré' },
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // Valider le mot de passe
    const hasMinLength = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    if (!hasMinLength || !hasUppercase || !hasNumber) {
      return NextResponse.json(
        {
          error:
            'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre',
        },
        { status: 400 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)

    // Créer l'utilisateur et marquer le code comme utilisé
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role: 'MEMBER',
      },
    })

    await db.invitationCode.update({
      where: { id: invitation.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedById: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
    })
  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    )
  }
}

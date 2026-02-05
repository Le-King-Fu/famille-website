import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// Phone format validation: +1-XXX-XXX-XXXX
const PHONE_REGEX = /^\+1-\d{3}-\d{3}-\d{4}$/
const PHONE_TYPES = ['cell', 'home', 'work', 'other'] as const

// GET /api/users/me - Get current user profile
export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        phone: true,
        phoneType: true,
        phone2: true,
        phone2Type: true,
        phone3: true,
        phone3Type: true,
        address: true,
        avatarUrl: true,
        privacyConsentAt: true,
        _count: {
          select: {
            gameScores: true,
            topics: true,
            replies: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    )
  }
}

// PUT /api/users/me - Update current user profile
export async function PUT(request: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const updateData: {
      email?: string
      firstName?: string
      lastName?: string
      phone?: string | null
      phoneType?: string | null
      phone2?: string | null
      phone2Type?: string | null
      phone3?: string | null
      phone3Type?: string | null
      address?: string | null
      privacyConsentAt?: Date
    } = {}

    // Get current user to check privacy consent
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { privacyConsentAt: true },
    })

    // Handle email update with uniqueness check
    if (body.email && typeof body.email === 'string') {
      const newEmail = body.email.trim().toLowerCase()

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newEmail)) {
        return NextResponse.json(
          { error: 'Format d\'email invalide' },
          { status: 400 }
        )
      }

      // Check if email already exists for another user
      const existingUser = await db.user.findUnique({
        where: { email: newEmail },
        select: { id: true },
      })

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé par un autre compte' },
          { status: 400 }
        )
      }

      updateData.email = newEmail
    }

    if (body.firstName && typeof body.firstName === 'string') {
      const firstName = body.firstName.trim()
      if (firstName.length < 1) {
        return NextResponse.json(
          { error: 'Le prénom est requis' },
          { status: 400 }
        )
      }
      updateData.firstName = firstName
    }

    if (body.lastName && typeof body.lastName === 'string') {
      const lastName = body.lastName.trim()
      if (lastName.length < 1) {
        return NextResponse.json(
          { error: 'Le nom est requis' },
          { status: 400 }
        )
      }
      updateData.lastName = lastName
    }

    // Handle privacy consent
    if (body.privacyConsent === true) {
      updateData.privacyConsentAt = new Date()
    }

    // Handle phone update
    if (body.phone !== undefined) {
      if (body.phone === null || body.phone === '') {
        updateData.phone = null
      } else if (typeof body.phone === 'string') {
        const phone = body.phone.trim()
        if (!PHONE_REGEX.test(phone)) {
          return NextResponse.json(
            { error: 'Format de téléphone invalide. Utilisez +1-XXX-XXX-XXXX' },
            { status: 400 }
          )
        }
        // Check privacy consent for phone
        if (!currentUser?.privacyConsentAt && !body.privacyConsent) {
          return NextResponse.json(
            { error: 'Vous devez accepter la politique de confidentialité pour ajouter vos coordonnées' },
            { status: 400 }
          )
        }
        updateData.phone = phone
      }
    }

    // Handle phoneType update
    if (body.phoneType !== undefined) {
      if (body.phoneType === null || body.phoneType === '') {
        updateData.phoneType = null
      } else if (typeof body.phoneType === 'string' && PHONE_TYPES.includes(body.phoneType as typeof PHONE_TYPES[number])) {
        updateData.phoneType = body.phoneType
      }
    }

    // Handle phone2 update
    if (body.phone2 !== undefined) {
      if (body.phone2 === null || body.phone2 === '') {
        updateData.phone2 = null
        updateData.phone2Type = null
      } else if (typeof body.phone2 === 'string') {
        const phone2 = body.phone2.trim()
        if (!PHONE_REGEX.test(phone2)) {
          return NextResponse.json(
            { error: 'Format de téléphone 2 invalide. Utilisez +1-XXX-XXX-XXXX' },
            { status: 400 }
          )
        }
        if (!currentUser?.privacyConsentAt && !body.privacyConsent) {
          return NextResponse.json(
            { error: 'Vous devez accepter la politique de confidentialité pour ajouter vos coordonnées' },
            { status: 400 }
          )
        }
        updateData.phone2 = phone2
      }
    }

    // Handle phone2Type update
    if (body.phone2Type !== undefined) {
      if (body.phone2Type === null || body.phone2Type === '') {
        updateData.phone2Type = null
      } else if (typeof body.phone2Type === 'string' && PHONE_TYPES.includes(body.phone2Type as typeof PHONE_TYPES[number])) {
        updateData.phone2Type = body.phone2Type
      }
    }

    // Handle phone3 update
    if (body.phone3 !== undefined) {
      if (body.phone3 === null || body.phone3 === '') {
        updateData.phone3 = null
        updateData.phone3Type = null
      } else if (typeof body.phone3 === 'string') {
        const phone3 = body.phone3.trim()
        if (!PHONE_REGEX.test(phone3)) {
          return NextResponse.json(
            { error: 'Format de téléphone 3 invalide. Utilisez +1-XXX-XXX-XXXX' },
            { status: 400 }
          )
        }
        if (!currentUser?.privacyConsentAt && !body.privacyConsent) {
          return NextResponse.json(
            { error: 'Vous devez accepter la politique de confidentialité pour ajouter vos coordonnées' },
            { status: 400 }
          )
        }
        updateData.phone3 = phone3
      }
    }

    // Handle phone3Type update
    if (body.phone3Type !== undefined) {
      if (body.phone3Type === null || body.phone3Type === '') {
        updateData.phone3Type = null
      } else if (typeof body.phone3Type === 'string' && PHONE_TYPES.includes(body.phone3Type as typeof PHONE_TYPES[number])) {
        updateData.phone3Type = body.phone3Type
      }
    }

    // Handle address update
    if (body.address !== undefined) {
      if (body.address === null || body.address === '') {
        updateData.address = null
      } else if (typeof body.address === 'string') {
        const address = body.address.trim()
        if (address.length > 500) {
          return NextResponse.json(
            { error: 'L\'adresse ne peut pas dépasser 500 caractères' },
            { status: 400 }
          )
        }
        // Check privacy consent for address
        if (!currentUser?.privacyConsentAt && !body.privacyConsent) {
          return NextResponse.json(
            { error: 'Vous devez accepter la politique de confidentialité pour ajouter vos coordonnées' },
            { status: 400 }
          )
        }
        updateData.address = address
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée valide à mettre à jour' },
        { status: 400 }
      )
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        phone: true,
        phoneType: true,
        phone2: true,
        phone2Type: true,
        phone3: true,
        phone3Type: true,
        address: true,
        avatarUrl: true,
        privacyConsentAt: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateVCard, generateVCardFilename } from '@/lib/vcard'

// GET /api/contacts/[id]/vcard - Export single contact as vCard
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const { id } = await params

    const contact = await db.user.findUnique({
      where: { id, isActive: true },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        phoneType: true,
        phone2: true,
        phone2Type: true,
        phone3: true,
        phone3Type: true,
        address: true,
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 })
    }

    const vcard = generateVCard(contact)
    const filename = generateVCardFilename(contact.firstName, contact.lastName)

    return new NextResponse(vcard, {
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating vCard:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du vCard' },
      { status: 500 }
    )
  }
}

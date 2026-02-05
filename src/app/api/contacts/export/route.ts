import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { generateVCardBatch } from '@/lib/vcard'

// GET /api/contacts/export - Export all contacts as vCard batch
export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  try {
    const contacts = await db.user.findMany({
      where: { isActive: true },
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
      orderBy: { lastName: 'asc' },
    })

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'Aucun contact à exporter' }, { status: 404 })
    }

    const vcard = generateVCardBatch(contacts)
    const filename = 'famille-landry-contacts.vcf'

    return new NextResponse(vcard, {
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating vCard batch:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération des vCards' },
      { status: 500 }
    )
  }
}

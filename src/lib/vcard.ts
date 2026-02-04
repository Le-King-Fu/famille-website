/**
 * vCard 3.0 generator for contact export
 */

export interface VCardContact {
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  address?: string | null
}

/**
 * Escape special characters for vCard format
 */
function escapeVCard(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Generate a vCard 3.0 string for a single contact
 */
export function generateVCard(contact: VCardContact): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCard(contact.lastName)};${escapeVCard(contact.firstName)};;;`,
    `FN:${escapeVCard(contact.firstName)} ${escapeVCard(contact.lastName)}`,
    `EMAIL:${contact.email}`,
  ]

  if (contact.phone) {
    lines.push(`TEL;TYPE=CELL:${contact.phone}`)
  }

  if (contact.address) {
    // ADR format: PO Box;Extended;Street;City;State;Postal;Country
    // We use simplified format with just the full address in street field
    lines.push(`ADR;TYPE=HOME:;;${escapeVCard(contact.address)};;;;`)
  }

  lines.push('END:VCARD')

  return lines.join('\r\n')
}

/**
 * Generate a combined vCard file for multiple contacts
 */
export function generateVCardBatch(contacts: VCardContact[]): string {
  return contacts.map(generateVCard).join('\r\n')
}

/**
 * Generate a safe filename from contact name
 */
export function generateVCardFilename(firstName: string, lastName: string): string {
  const sanitize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

  return `${sanitize(firstName)}-${sanitize(lastName)}.vcf`
}

'use client'

import { Mail, Phone, MapPin, Download } from 'lucide-react'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  address: string | null
  avatarUrl: string | null
}

interface ContactCardProps {
  contact: Contact
}

export function ContactCard({ contact }: ContactCardProps) {
  const initials = `${contact.firstName[0]}${contact.lastName[0]}`
  const fullName = `${contact.firstName} ${contact.lastName}`

  const handleExport = () => {
    // Trigger download of individual vCard
    window.location.href = `/api/contacts/${contact.id}/vcard`
  }

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {contact.avatarUrl ? (
            <img
              src={contact.avatarUrl}
              alt={fullName}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 bg-bleu/10 dark:bg-bleu/20 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-bleu">{initials}</span>
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{fullName}</h3>

          <div className="mt-2 space-y-1.5">
            {/* Email */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <a
                href={`mailto:${contact.email}`}
                className="truncate hover:text-bleu"
              >
                {contact.email}
              </a>
            </div>

            {/* Phone */}
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Phone className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <a
                  href={`tel:${contact.phone}`}
                  className="hover:text-bleu"
                >
                  {contact.phone}
                </a>
              </div>
            )}

            {/* Address */}
            {contact.address && (
              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400 mt-0.5" />
                <span className="line-clamp-2">{contact.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-bleu hover:bg-bleu/10 rounded-lg transition-colors"
          title="Exporter le contact"
        >
          <Download className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

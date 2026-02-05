'use client'

import { useState, useEffect } from 'react'
import { Users, Download, Loader2 } from 'lucide-react'
import { ContactCard } from '@/components/contact/ContactCard'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  phoneType: string | null
  phone2: string | null
  phone2Type: string | null
  phone3: string | null
  phone3Type: string | null
  address: string | null
  avatarUrl: string | null
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts')
      const data = await response.json()

      if (response.ok) {
        setContacts(data.contacts)
      } else {
        setError(data.error || 'Erreur lors du chargement')
      }
    } catch (err) {
      setError('Erreur lors du chargement des contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleExportAll = () => {
    window.location.href = '/api/contacts/export'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-bleu" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-bleu" />
          Carnet de contacts
        </h1>
        <button
          onClick={handleExportAll}
          className="btn-outline flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Exporter tout
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="card text-center py-8">
          <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Aucun contact trouvé</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  )
}

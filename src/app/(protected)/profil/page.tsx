'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { User, Mail, Calendar, Trophy, Pencil, X, Loader2, AlertTriangle, Check, Phone, MapPin } from 'lucide-react'
import { PrivacyConsentModal } from '@/components/contact/PrivacyConsentModal'

interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  createdAt: string
  phone: string | null
  address: string | null
  avatarUrl: string | null
  privacyConsentAt: string | null
  _count: {
    gameScores: number
    topics: number
    replies: number
  }
}

export default function ProfilPage() {
  const { data: session } = useSession()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  // Contact editing state
  const [editingContact, setEditingContact] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [pendingContactSave, setPendingContactSave] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/me')
      const data = await response.json()
      if (response.ok) {
        setUser(data.user)
        setFirstName(data.user.firstName)
        setLastName(data.user.lastName)
        setEmail(data.user.email)
        setPhone(data.user.phone || '')
        setAddress(data.user.address || '')
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser((prev) => prev ? { ...prev, ...data.user } : null)
        setEditing(false)
        setSuccess('Profil mis à jour avec succès')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setEmail(user.email)
    }
    setEditing(false)
    setError('')
  }

  const handleCancelContact = () => {
    if (user) {
      setPhone(user.phone || '')
      setAddress(user.address || '')
    }
    setEditingContact(false)
    setError('')
  }

  // Format phone number as user types
  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')

    // Format as +1-XXX-XXX-XXXX
    if (digits.length === 0) return ''
    if (digits.length <= 1) return `+${digits}`
    if (digits.length <= 4) return `+${digits.slice(0, 1)}-${digits.slice(1)}`
    if (digits.length <= 7) return `+${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4)}`
    return `+${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
  }

  const handleSaveContact = async (withConsent: boolean = false) => {
    setSavingContact(true)
    setError('')
    setSuccess('')

    try {
      const body: {
        phone?: string | null
        address?: string | null
        privacyConsent?: boolean
      } = {}

      // Only send phone if it changed
      if (phone !== (user?.phone || '')) {
        body.phone = phone || null
      }

      // Only send address if it changed
      if (address !== (user?.address || '')) {
        body.address = address || null
      }

      if (withConsent) {
        body.privacyConsent = true
      }

      if (Object.keys(body).length === 0) {
        setEditingContact(false)
        setSavingContact(false)
        return
      }

      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        setUser((prev) => prev ? { ...prev, ...data.user } : null)
        setEditingContact(false)
        setSuccess('Coordonnées mises à jour avec succès')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour')
    } finally {
      setSavingContact(false)
      setPendingContactSave(false)
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if adding contact info without prior consent
    const hasContactInfo = phone || address
    const hadContactInfo = user?.phone || user?.address
    const needsConsent = hasContactInfo && !hadContactInfo && !user?.privacyConsentAt

    if (needsConsent) {
      setPendingContactSave(true)
      setShowConsentModal(true)
    } else {
      await handleSaveContact(false)
    }
  }

  const handleConsentAccept = async () => {
    setShowConsentModal(false)
    await handleSaveContact(true)
  }

  const handleConsentCancel = () => {
    setShowConsentModal(false)
    setPendingContactSave(false)
  }

  const emailChanged = user && email.trim().toLowerCase() !== user.email.toLowerCase()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-bleu" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-bleu" />
          Mon profil
        </h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="btn-outline flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Modifier
          </button>
        )}
      </div>

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <Check className="h-5 w-5 text-green-600 dark:text-green-500" />
          <p className="text-green-700 dark:text-green-400">{success}</p>
        </div>
      )}

      <div className="card">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-bleu/10 dark:bg-bleu/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-bleu">
                  {firstName[0] || user.firstName[0]}
                  {lastName[0] || user.lastName[0]}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {user.role.toLowerCase()}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
              {emailChanged && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Vous devrez vous connecter avec ce nouvel email
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="btn-outline"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Enregistrer
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-bleu/10 dark:bg-bleu/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-bleu">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Mail className="h-5 w-5 text-gray-400" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span>
                  Membre depuis le{' '}
                  {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Contact Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Phone className="h-5 w-5 text-bleu" />
            Coordonnées
          </h3>
          {!editingContact && (
            <button
              onClick={() => setEditingContact(true)}
              className="text-sm text-bleu hover:underline flex items-center gap-1"
            >
              <Pencil className="h-3 w-3" />
              Modifier
            </button>
          )}
        </div>

        {editingContact ? (
          <form onSubmit={handleContactSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+1-514-555-1234"
                className="input"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Format: +1-XXX-XXX-XXXX
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Adresse</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Rue Example, Ville, Province, Code postal"
                className="input min-h-[80px]"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {address.length}/500 caractères
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelContact}
                disabled={savingContact}
                className="btn-outline"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={savingContact}
                className="btn-primary flex items-center gap-2"
              >
                {savingContact ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Enregistrer
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <Phone className="h-5 w-5 text-gray-400" />
              {user.phone ? (
                <a href={`tel:${user.phone}`} className="hover:text-bleu">
                  {user.phone}
                </a>
              ) : (
                <span className="text-gray-400 italic">Non renseigné</span>
              )}
            </div>
            <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
              <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              {user.address ? (
                <span className="whitespace-pre-wrap">{user.address}</span>
              ) : (
                <span className="text-gray-400 italic">Non renseignée</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-terracotta" />
          Statistiques
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-bleu">
              {user._count.gameScores}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Parties jouées</div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-bleu">
              {user._count.topics}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Sujets créés</div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-bleu">
              {user._count.replies}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Réponses</div>
          </div>
        </div>
      </div>

      {/* Privacy Consent Modal */}
      {showConsentModal && (
        <PrivacyConsentModal
          onAccept={handleConsentAccept}
          onCancel={handleConsentCancel}
        />
      )}
    </div>
  )
}

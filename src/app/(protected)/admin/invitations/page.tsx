'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Loader2, Copy, Check } from 'lucide-react'
import { InvitationTable } from '@/components/admin/InvitationTable'

interface Invitation {
  id: string
  code: string
  isUsed: boolean
  usedAt: string | null
  expiresAt: string
  createdAt: string
  status: 'active' | 'used' | 'expired'
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
  usedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
}

type FilterStatus = 'all' | 'active' | 'used' | 'expired'

export default function AdminInvitationsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-bleu" /></div>}>
      <AdminInvitationsContent />
    </Suspense>
  )
}

function AdminInvitationsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCode, setNewCode] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [expirationDays, setExpirationDays] = useState(7)
  const [copied, setCopied] = useState(false)

  const fetchInvitations = useCallback(async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const response = await fetch(`/api/admin/invitations${params}`)
      const data = await response.json()
      if (response.ok) {
        setInvitations(data.invitations)
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    if (status === 'loading') return
    if (session?.user?.role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchInvitations()
  }, [session, status, router, fetchInvitations])

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expirationDays }),
      })

      if (response.ok) {
        const { invitation } = await response.json()
        setNewCode(invitation.code)
        setInvitations((prev) => [invitation, ...prev])
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Error creating invitation:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleRevoke = async (invitation: Invitation) => {
    if (!confirm(`Révoquer le code d'invitation ${invitation.code} ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/invitations/${invitation.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setInvitations((prev) => prev.filter((i) => i.id !== invitation.id))
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Error revoking invitation:', error)
    }
  }

  const handleCopyNewCode = async () => {
    if (!newCode) return
    await navigator.clipboard.writeText(newCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setNewCode(null)
    setExpirationDays(7)
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-bleu" />
      </div>
    )
  }

  const counts = {
    all: invitations.length,
    active: invitations.filter((i) => i.status === 'active').length,
    used: invitations.filter((i) => i.status === 'used').length,
    expired: invitations.filter((i) => i.status === 'expired').length,
  }

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'active', label: 'Actifs' },
    { key: 'used', label: 'Utilisés' },
    { key: 'expired', label: 'Expirés' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Codes d&apos;invitation</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Générer un code
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setFilter(tab.key)
              setLoading(true)
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === tab.key
                ? 'border-bleu text-bleu'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({counts[tab.key]})</span>
          </button>
        ))}
      </div>

      {/* Invitations table */}
      <div className="card">
        {invitations.length > 0 ? (
          <InvitationTable invitations={invitations} onRevoke={handleRevoke} />
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Aucun code d&apos;invitation
          </p>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            {newCode ? (
              <>
                <h2 className="text-lg font-semibold mb-4">Code créé</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Partagez ce code avec la personne que vous souhaitez inviter.
                  Ce code ne sera plus affiché.
                </p>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg font-mono text-lg">
                  <span className="flex-1 text-center">{newCode}</span>
                  <button
                    onClick={handleCopyNewCode}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <button
                  onClick={closeCreateModal}
                  className="btn-primary w-full mt-4"
                >
                  Fermer
                </button>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold mb-4">
                  Générer un code d&apos;invitation
                </h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Durée de validité
                  </label>
                  <select
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(Number(e.target.value))}
                    className="input"
                  >
                    <option value={7}>7 jours</option>
                    <option value={14}>14 jours</option>
                    <option value={30}>30 jours</option>
                    <option value={90}>90 jours</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={closeCreateModal}
                    className="btn-outline flex-1"
                    disabled={isCreating}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="btn-primary flex-1"
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      'Générer'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

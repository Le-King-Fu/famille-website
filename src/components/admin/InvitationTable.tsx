'use client'

import { Copy, Check, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { StatusBadge } from './StatusBadge'

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

interface InvitationTableProps {
  invitations: Invitation[]
  onRevoke: (invitation: Invitation) => void
}

export function InvitationTable({ invitations, onRevoke }: InvitationTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm text-gray-500">
            <th className="pb-3 font-medium">Code</th>
            <th className="pb-3 font-medium">Statut</th>
            <th className="pb-3 font-medium">Créé par</th>
            <th className="pb-3 font-medium">Expiration</th>
            <th className="pb-3 font-medium">Utilisé par</th>
            <th className="pb-3 font-medium sr-only">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {invitations.map((invitation) => (
            <tr key={invitation.id} className="text-sm">
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <code className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                    {invitation.code}
                  </code>
                  {invitation.status === 'active' && (
                    <button
                      onClick={() => handleCopy(invitation.code, invitation.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Copier le code"
                    >
                      {copiedId === invitation.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              </td>
              <td className="py-3">
                <StatusBadge
                  status={invitation.status}
                  labels={{ used: 'Utilisé', expired: 'Expiré', active: 'Actif' }}
                />
              </td>
              <td className="py-3 text-gray-600">
                {invitation.createdBy.firstName} {invitation.createdBy.lastName}
              </td>
              <td className="py-3 text-gray-600">{formatDate(invitation.expiresAt)}</td>
              <td className="py-3">
                {invitation.usedBy ? (
                  <div>
                    <span className="font-medium">
                      {invitation.usedBy.firstName} {invitation.usedBy.lastName}
                    </span>
                    <span className="text-gray-500 text-xs block">
                      {invitation.usedBy.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="py-3">
                {invitation.status === 'active' && (
                  <button
                    onClick={() => onRevoke(invitation)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded transition-colors"
                    title="Révoquer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

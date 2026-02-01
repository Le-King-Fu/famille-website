'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

type Role = 'ADMIN' | 'MEMBER' | 'CHILD'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  isActive: boolean
}

interface UserModalProps {
  user: User
  currentUserId: string
  onClose: () => void
  onSave: (data: { firstName: string; lastName: string; role: Role }) => Promise<void>
}

export function UserModal({ user, currentUserId, onClose, onSave }: UserModalProps) {
  const [firstName, setFirstName] = useState(user.firstName)
  const [lastName, setLastName] = useState(user.lastName)
  const [role, setRole] = useState<Role>(user.role)
  const [isLoading, setIsLoading] = useState(false)

  const isSelf = user.id === currentUserId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return

    setIsLoading(true)
    try {
      await onSave({ firstName: firstName.trim(), lastName: lastName.trim(), role })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Modifier l&apos;utilisateur</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="input bg-gray-50"
            />
          </div>

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
            <label className="block text-sm font-medium mb-1">Rôle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="input"
              disabled={isSelf}
            >
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Membre</option>
              <option value="CHILD">Enfant</option>
            </select>
            {isSelf && (
              <p className="text-xs text-gray-500 mt-1">
                Vous ne pouvez pas modifier votre propre rôle
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

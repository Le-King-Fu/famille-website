'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Loader2, Copy, Check } from 'lucide-react'
import { UserTable } from '@/components/admin/UserTable'
import { UserModal } from '@/components/admin/UserModal'

type Role = 'ADMIN' | 'MEMBER' | 'CHILD'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
  _count: {
    photos: number
    topics: number
    replies: number
    albums: number
  }
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-bleu" /></div>}>
      <AdminUsersContent />
    </Suspense>
  )
}

function AdminUsersContent() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [tempPassword, setTempPassword] = useState<{ user: User; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      if (response.ok) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    if (session?.user?.role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchUsers()
  }, [session, status, router, fetchUsers])

  const handleEdit = (user: User) => {
    setEditingUser(user)
  }

  const handleSave = async (data: { firstName: string; lastName: string; role: Role }) => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const { user } = await response.json()
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, ...user } : u))
        )
        setEditingUser(null)
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleResetPassword = async (user: User) => {
    if (!confirm(`Réinitialiser le mot de passe de ${user.firstName} ${user.lastName} ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setTempPassword({ user, password: data.tempPassword })
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Error resetting password:', error)
    }
  }

  const handleToggleActive = async (user: User) => {
    const action = user.isActive ? 'désactiver' : 'activer'
    if (!confirm(`Voulez-vous ${action} le compte de ${user.firstName} ${user.lastName} ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      })

      if (response.ok) {
        const { user: updatedUser } = await response.json()
        setUsers((prev) =>
          prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
        )
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  const handleCopyPassword = async () => {
    if (!tempPassword) return
    await navigator.clipboard.writeText(tempPassword.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredUsers = users.filter((user) => {
    const searchLower = search.toLowerCase()
    return (
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    )
  })

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-bleu" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Users table */}
      <div className="card">
        {filteredUsers.length > 0 ? (
          <UserTable
            users={filteredUsers}
            currentUserId={session?.user?.id || ''}
            onEdit={handleEdit}
            onResetPassword={handleResetPassword}
            onToggleActive={handleToggleActive}
          />
        ) : (
          <p className="text-center text-gray-500 py-8">
            {search ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
          </p>
        )}
      </div>

      {/* Edit modal */}
      {editingUser && (
        <UserModal
          user={editingUser}
          currentUserId={session?.user?.id || ''}
          onClose={() => setEditingUser(null)}
          onSave={handleSave}
        />
      )}

      {/* Temp password modal */}
      {tempPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Mot de passe temporaire</h2>
            <p className="text-sm text-gray-600 mb-4">
              Mot de passe temporaire pour {tempPassword.user.firstName} {tempPassword.user.lastName}.
              Ce mot de passe ne sera plus affiché.
            </p>
            <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg font-mono">
              <span className="flex-1">{tempPassword.password}</span>
              <button
                onClick={handleCopyPassword}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              L&apos;utilisateur devra changer son mot de passe à la prochaine connexion.
            </p>
            <button
              onClick={() => setTempPassword(null)}
              className="btn-primary w-full mt-4"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

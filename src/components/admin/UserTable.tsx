'use client'

import { Edit2, Key, MoreVertical } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { RoleBadge } from './RoleBadge'
import { StatusBadge } from './StatusBadge'

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

interface UserTableProps {
  users: User[]
  currentUserId: string
  onEdit: (user: User) => void
  onResetPassword: (user: User) => void
  onToggleActive: (user: User) => void
}

export function UserTable({
  users,
  currentUserId,
  onEdit,
  onResetPassword,
  onToggleActive,
}: UserTableProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDate = (date: string | null) => {
    if (!date) return 'Jamais'
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
            <th className="pb-3 font-medium">Nom</th>
            <th className="pb-3 font-medium">Email</th>
            <th className="pb-3 font-medium">Rôle</th>
            <th className="pb-3 font-medium">Statut</th>
            <th className="pb-3 font-medium">Dernière connexion</th>
            <th className="pb-3 font-medium">Activité</th>
            <th className="pb-3 font-medium sr-only">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id} className="text-sm">
              <td className="py-3">
                <span className="font-medium">
                  {user.firstName} {user.lastName}
                </span>
                {user.id === currentUserId && (
                  <span className="ml-2 text-xs text-gray-400">(vous)</span>
                )}
              </td>
              <td className="py-3 text-gray-600">{user.email}</td>
              <td className="py-3">
                <RoleBadge role={user.role} />
              </td>
              <td className="py-3">
                <StatusBadge status={user.isActive ? 'active' : 'inactive'} />
              </td>
              <td className="py-3 text-gray-600">{formatDate(user.lastLoginAt)}</td>
              <td className="py-3 text-gray-500 text-xs">
                {user._count.photos} photos, {user._count.topics + user._count.replies} posts
              </td>
              <td className="py-3">
                <div className="relative" ref={openMenu === user.id ? menuRef : null}>
                  <button
                    onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openMenu === user.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-white border rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => {
                          onEdit(user)
                          setOpenMenu(null)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          onResetPassword(user)
                          setOpenMenu(null)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Key className="h-4 w-4" />
                        Réinitialiser mot de passe
                      </button>
                      {user.id !== currentUserId && (
                        <button
                          onClick={() => {
                            onToggleActive(user)
                            setOpenMenu(null)
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                            user.isActive ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {user.isActive ? 'Désactiver le compte' : 'Activer le compte'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

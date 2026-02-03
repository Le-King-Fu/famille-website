'use client'

type Role = 'ADMIN' | 'MEMBER' | 'CHILD'

interface RoleBadgeProps {
  role: Role
}

const roleConfig: Record<Role, { label: string; className: string }> = {
  ADMIN: {
    label: 'Admin',
    className: 'bg-terracotta/10 text-terracotta',
  },
  MEMBER: {
    label: 'Membre',
    className: 'bg-bleu/10 text-bleu',
  },
  CHILD: {
    label: 'Enfant',
    className: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  },
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = roleConfig[role]

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

'use client'

type Status = 'active' | 'used' | 'expired' | 'inactive'

interface StatusBadgeProps {
  status: Status
  labels?: Partial<Record<Status, string>>
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  active: {
    label: 'Actif',
    className: 'bg-green-100 text-green-700',
  },
  used: {
    label: 'Utilisé',
    className: 'bg-bleu/10 text-bleu',
  },
  expired: {
    label: 'Expiré',
    className: 'bg-gray-100 text-gray-500',
  },
  inactive: {
    label: 'Inactif',
    className: 'bg-gray-100 text-gray-500',
  },
}

export function StatusBadge({ status, labels }: StatusBadgeProps) {
  const config = statusConfig[status]
  const label = labels?.[status] || config.label

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {label}
    </span>
  )
}

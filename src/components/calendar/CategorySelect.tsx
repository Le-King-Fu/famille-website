'use client'

import { EventCategory } from '@prisma/client'
import { categoryConfig } from './types'

interface CategorySelectProps {
  value: EventCategory
  onChange: (category: EventCategory) => void
}

export function CategorySelect({ value, onChange }: CategorySelectProps) {
  const categories = Object.entries(categoryConfig) as [
    EventCategory,
    (typeof categoryConfig)[EventCategory],
  ][]

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Catégorie
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {categories.map(([key, config]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors text-sm ${
              value === key
                ? 'border-bleu bg-bleu/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: config.color }}
            />
            <span className="truncate">
              {config.icon} {config.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

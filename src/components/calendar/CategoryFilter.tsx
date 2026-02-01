'use client'

import { EventCategory } from '@prisma/client'
import { categoryConfig } from './types'
import { Filter } from 'lucide-react'

interface CategoryFilterProps {
  selectedCategories: Set<EventCategory>
  onChange: (categories: Set<EventCategory>) => void
}

export function CategoryFilter({ selectedCategories, onChange }: CategoryFilterProps) {
  const categories = Object.entries(categoryConfig) as [
    EventCategory,
    (typeof categoryConfig)[EventCategory],
  ][]

  const allSelected = selectedCategories.size === categories.length

  const toggleCategory = (category: EventCategory) => {
    const newSet = new Set(selectedCategories)
    if (newSet.has(category)) {
      newSet.delete(category)
    } else {
      newSet.add(category)
    }
    onChange(newSet)
  }

  const toggleAll = () => {
    if (allSelected) {
      onChange(new Set())
    } else {
      onChange(new Set(categories.map(([key]) => key)))
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-sm text-gray-600">
        <Filter className="h-4 w-4" />
        Filtres:
      </span>

      <button
        type="button"
        onClick={toggleAll}
        className={`px-2 py-1 text-xs rounded-full border transition-colors ${
          allSelected
            ? 'bg-gray-800 text-white border-gray-800'
            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
        }`}
      >
        Tous
      </button>

      {categories.map(([key, config]) => {
        const isSelected = selectedCategories.has(key)
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggleCategory(key)}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-full border transition-colors ${
              isSelected
                ? 'text-white border-transparent'
                : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'
            }`}
            style={isSelected ? { backgroundColor: config.color, borderColor: config.color } : {}}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </button>
        )
      })}
    </div>
  )
}

'use client'

import { GripVertical, Edit2, Trash2, MessageSquare } from 'lucide-react'

interface ForumCategory {
  id: string
  name: string
  description: string | null
  order: number
  _count: {
    topics: number
  }
}

interface ForumCategoryTableProps {
  categories: ForumCategory[]
  onEdit: (category: ForumCategory) => void
  onDelete: (category: ForumCategory) => void
  onReorder: (categories: ForumCategory[]) => void
}

export function ForumCategoryTable({
  categories,
  onEdit,
  onDelete,
  onReorder,
}: ForumCategoryTableProps) {
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))

    if (dragIndex === dropIndex) return

    const newCategories = [...categories]
    const [draggedItem] = newCategories.splice(dragIndex, 1)
    newCategories.splice(dropIndex, 0, draggedItem)

    // Update order values
    const reorderedCategories = newCategories.map((c, idx) => ({
      ...c,
      order: idx,
    }))

    onReorder(reorderedCategories)
  }

  return (
    <div className="space-y-2">
      {categories.map((category, index) => (
        <div
          key={category.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          className="flex items-center gap-3 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors hover:border-bleu/30"
        >
          <button className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{category.name}</p>
            {category.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {category.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {category._count.topics}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(category)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Modifier"
            >
              <Edit2 className="h-4 w-4" />
            </button>

            <button
              onClick={() => onDelete(category)}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 rounded transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

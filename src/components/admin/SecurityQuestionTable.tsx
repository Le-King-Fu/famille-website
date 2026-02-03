'use client'

import { GripVertical, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'

interface SecurityQuestion {
  id: string
  question: string
  answer: string
  isActive: boolean
  order: number
}

interface SecurityQuestionTableProps {
  questions: SecurityQuestion[]
  onEdit: (question: SecurityQuestion) => void
  onDelete: (question: SecurityQuestion) => void
  onToggleActive: (question: SecurityQuestion) => void
  onReorder: (questions: SecurityQuestion[]) => void
}

export function SecurityQuestionTable({
  questions,
  onEdit,
  onDelete,
  onToggleActive,
  onReorder,
}: SecurityQuestionTableProps) {
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

    const newQuestions = [...questions]
    const [draggedItem] = newQuestions.splice(dragIndex, 1)
    newQuestions.splice(dropIndex, 0, draggedItem)

    // Update order values
    const reorderedQuestions = newQuestions.map((q, idx) => ({
      ...q,
      order: idx,
    }))

    onReorder(reorderedQuestions)
  }

  const activeCount = questions.filter((q) => q.isActive).length

  return (
    <div className="space-y-2">
      {questions.map((question, index) => (
        <div
          key={question.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          className={`flex items-center gap-3 p-3 rounded-lg border dark:border-gray-700 transition-colors ${
            question.isActive ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400'
          }`}
        >
          <button className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{question.question}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              Réponse : {question.answer}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleActive(question)}
              disabled={question.isActive && activeCount <= 3}
              className={`p-2 rounded transition-colors ${
                question.isActive && activeCount <= 3
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={
                question.isActive && activeCount <= 3
                  ? 'Minimum 3 questions actives requises'
                  : question.isActive
                  ? 'Désactiver'
                  : 'Activer'
              }
            >
              {question.isActive ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={() => onEdit(question)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>

            <button
              onClick={() => onDelete(question)}
              disabled={question.isActive && activeCount <= 3}
              className={`p-2 rounded transition-colors ${
                question.isActive && activeCount <= 3
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500'
              }`}
              title={
                question.isActive && activeCount <= 3
                  ? 'Minimum 3 questions actives requises'
                  : 'Supprimer'
              }
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

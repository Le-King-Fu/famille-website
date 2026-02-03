'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface SecurityQuestion {
  id: string
  question: string
  answer: string
  isActive: boolean
  order: number
}

interface SecurityQuestionModalProps {
  question?: SecurityQuestion | null
  onClose: () => void
  onSave: (data: { question: string; answer: string; isActive: boolean }) => Promise<void>
}

export function SecurityQuestionModal({
  question,
  onClose,
  onSave,
}: SecurityQuestionModalProps) {
  const [questionText, setQuestionText] = useState(question?.question || '')
  const [answer, setAnswer] = useState(question?.answer || '')
  const [isActive, setIsActive] = useState(question?.isActive ?? true)
  const [isLoading, setIsLoading] = useState(false)

  const isEditing = !!question

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!questionText.trim() || !answer.trim()) return

    setIsLoading(true)
    try {
      await onSave({
        question: questionText.trim(),
        answer: answer.trim(),
        isActive,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Modifier la question' : 'Nouvelle question'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Question</label>
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="input"
              placeholder="Quel est le nom de famille de grand-mère ?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Réponse</label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="input"
              placeholder="dupont"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              La réponse sera stockée en minuscules pour une comparaison insensible à la casse.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            />
            <label htmlFor="isActive" className="text-sm">
              Question active (visible lors de l&apos;inscription)
            </label>
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
              ) : isEditing ? (
                'Enregistrer'
              ) : (
                'Créer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

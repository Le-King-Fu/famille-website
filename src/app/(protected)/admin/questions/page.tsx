'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'
import { SecurityQuestionTable } from '@/components/admin/SecurityQuestionTable'
import { SecurityQuestionModal } from '@/components/admin/SecurityQuestionModal'

interface SecurityQuestion {
  id: string
  question: string
  answer: string
  isActive: boolean
  order: number
}

export default function AdminQuestionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-bleu" /></div>}>
      <AdminQuestionsContent />
    </Suspense>
  )
}

function AdminQuestionsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [questions, setQuestions] = useState<SecurityQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [editingQuestion, setEditingQuestion] = useState<SecurityQuestion | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/security-questions')
      const data = await response.json()
      if (response.ok) {
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
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
    fetchQuestions()
  }, [session, status, router, fetchQuestions])

  const handleCreate = async (data: {
    question: string
    answer: string
    isActive: boolean
  }) => {
    try {
      const response = await fetch('/api/admin/security-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const { question } = await response.json()
        setQuestions((prev) => [...prev, question])
        setShowCreateModal(false)
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Error creating question:', error)
    }
  }

  const handleEdit = async (data: {
    question: string
    answer: string
    isActive: boolean
  }) => {
    if (!editingQuestion) return

    try {
      const response = await fetch(
        `/api/admin/security-questions/${editingQuestion.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )

      if (response.ok) {
        const { question } = await response.json()
        setQuestions((prev) =>
          prev.map((q) => (q.id === question.id ? question : q))
        )
        setEditingQuestion(null)
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Error updating question:', error)
    }
  }

  const handleDelete = async (question: SecurityQuestion) => {
    if (!confirm(`Supprimer la question "${question.question}" ?`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/admin/security-questions/${question.id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== question.id))
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Error deleting question:', error)
    }
  }

  const handleToggleActive = async (question: SecurityQuestion) => {
    try {
      const response = await fetch(
        `/api/admin/security-questions/${question.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !question.isActive }),
        }
      )

      if (response.ok) {
        const { question: updated } = await response.json()
        setQuestions((prev) =>
          prev.map((q) => (q.id === updated.id ? updated : q))
        )
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Error toggling question:', error)
    }
  }

  const handleReorder = async (reorderedQuestions: SecurityQuestion[]) => {
    // Update local state immediately for responsiveness
    setQuestions(reorderedQuestions)

    try {
      const response = await fetch('/api/admin/security-questions/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: reorderedQuestions.map((q) => q.id),
        }),
      })

      if (!response.ok) {
        // Revert on failure
        fetchQuestions()
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Error reordering questions:', error)
      fetchQuestions()
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-bleu" />
      </div>
    )
  }

  const activeCount = questions.filter((q) => q.isActive).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Questions de sécurité</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle question
        </button>
      </div>

      {/* Info */}
      <div className="bg-bleu/10 text-bleu p-4 rounded-lg text-sm">
        <p>
          <strong>{activeCount}</strong> question{activeCount > 1 ? 's' : ''} active
          {activeCount > 1 ? 's' : ''}. Minimum 3 requises pour le portail d&apos;inscription.
          Glissez-déposez pour réorganiser l&apos;ordre.
        </p>
      </div>

      {/* Questions list */}
      <div className="card">
        {questions.length > 0 ? (
          <SecurityQuestionTable
            questions={questions}
            onEdit={setEditingQuestion}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
            onReorder={handleReorder}
          />
        ) : (
          <p className="text-center text-gray-500 py-8">
            Aucune question de sécurité
          </p>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <SecurityQuestionModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
        />
      )}

      {/* Edit modal */}
      {editingQuestion && (
        <SecurityQuestionModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  )
}

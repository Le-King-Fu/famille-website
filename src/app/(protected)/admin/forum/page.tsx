'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'
import { ForumCategoryTable } from '@/components/admin/ForumCategoryTable'
import { ForumCategoryModal } from '@/components/admin/ForumCategoryModal'

interface ForumCategory {
  id: string
  name: string
  description: string | null
  order: number
  _count: {
    topics: number
  }
}

export default function AdminForumPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-bleu" /></div>}>
      <AdminForumContent />
    </Suspense>
  )
}

function AdminForumContent() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<ForumCategory | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/forum-categories')
      const data = await response.json()
      if (response.ok) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
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
    fetchCategories()
  }, [session, status, router, fetchCategories])

  const handleCreate = async (data: { name: string; description: string }) => {
    try {
      const response = await fetch('/api/admin/forum-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const { category } = await response.json()
        setCategories((prev) => [...prev, category])
        setShowCreateModal(false)
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }

  const handleEdit = async (data: { name: string; description: string }) => {
    if (!editingCategory) return

    try {
      const response = await fetch(
        `/api/admin/forum-categories/${editingCategory.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )

      if (response.ok) {
        const { category } = await response.json()
        setCategories((prev) =>
          prev.map((c) => (c.id === category.id ? category : c))
        )
        setEditingCategory(null)
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  const handleDelete = async (category: ForumCategory) => {
    const topicCount = category._count.topics

    let confirmMessage = `Supprimer la catégorie "${category.name}" ?`
    if (topicCount > 0) {
      confirmMessage = `La catégorie "${category.name}" contient ${topicCount} sujet${topicCount > 1 ? 's' : ''}. Cette action supprimera également tous les sujets et réponses associés. Continuer ?`
    }

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const url = topicCount > 0
        ? `/api/admin/forum-categories/${category.id}?confirm=true`
        : `/api/admin/forum-categories/${category.id}`

      const response = await fetch(url, { method: 'DELETE' })

      if (response.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== category.id))
      } else {
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const handleReorder = async (reorderedCategories: ForumCategory[]) => {
    // Update local state immediately for responsiveness
    setCategories(reorderedCategories)

    try {
      const response = await fetch('/api/admin/forum-categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: reorderedCategories.map((c) => c.id),
        }),
      })

      if (!response.ok) {
        // Revert on failure
        fetchCategories()
        const error = await response.json()
        alert(error.error)
      }
    } catch (error) {
      console.error('Error reordering categories:', error)
      fetchCategories()
    }
  }

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Catégories du forum</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle catégorie
        </button>
      </div>

      {/* Info */}
      <div className="bg-bleu/10 text-bleu p-4 rounded-lg text-sm">
        <p>
          <strong>{categories.length}</strong> catégorie{categories.length > 1 ? 's' : ''}.
          Glissez-déposez pour réorganiser l&apos;ordre d&apos;affichage sur le forum.
        </p>
      </div>

      {/* Categories list */}
      <div className="card">
        {categories.length > 0 ? (
          <ForumCategoryTable
            categories={categories}
            onEdit={setEditingCategory}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
        ) : (
          <p className="text-center text-gray-500 py-8">
            Aucune catégorie de forum
          </p>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <ForumCategoryModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
        />
      )}

      {/* Edit modal */}
      {editingCategory && (
        <ForumCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  )
}

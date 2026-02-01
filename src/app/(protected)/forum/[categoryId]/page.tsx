'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Loader2, MessageSquare } from 'lucide-react'
import { TopicCard, TopicForm, Topic, ForumCategory } from '@/components/forum'

export default function CategoryTopicsPage() {
  const params = useParams()
  const categoryId = params.categoryId as string

  const [category, setCategory] = useState<ForumCategory | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewTopic, setShowNewTopic] = useState(false)

  const fetchTopics = useCallback(async () => {
    try {
      const response = await fetch(`/api/forum/categories/${categoryId}/topics`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement')
      }

      setCategory(data.category)
      setTopics(data.topics)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    fetchTopics()
  }, [fetchTopics])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-bleu" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href="/forum"
          className="inline-flex items-center gap-1 text-gray-600 hover:text-bleu transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au forum
        </Link>
        <div className="card bg-red-50 border-red-200 text-red-700">
          <p>Erreur: {error}</p>
          <button onClick={fetchTopics} className="mt-2 text-sm underline">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/forum"
          className="inline-flex items-center gap-1 text-gray-600 hover:text-bleu transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au forum
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-bleu" />
            <h1 className="text-2xl font-bold">{category?.name}</h1>
          </div>
          <button
            onClick={() => setShowNewTopic(!showNewTopic)}
            className="btn-primary flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau sujet</span>
          </button>
        </div>
        {category?.description && (
          <p className="text-gray-500 mt-1">{category.description}</p>
        )}
      </div>

      {/* New topic form */}
      {showNewTopic && (
        <TopicForm
          categoryId={categoryId}
          onClose={() => setShowNewTopic(false)}
        />
      )}

      {/* Topics list */}
      {topics.length === 0 ? (
        <div className="card text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucun sujet dans cette catégorie.</p>
          <p className="text-gray-400 text-sm mt-1">
            Soyez le premier à créer un sujet !
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} categoryId={categoryId} />
          ))}
        </div>
      )}
    </div>
  )
}

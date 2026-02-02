'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, Pin, Trash2, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import {
  ReplyCard,
  ReplyForm,
  FormatContent,
  Topic,
  Reply,
} from '@/components/forum'

export default function TopicPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const categoryId = params.categoryId as string
  const topicId = params.topicId as string

  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quotedReply, setQuotedReply] = useState<Reply | null>(null)
  const [isPinning, setIsPinning] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isAdmin = session?.user?.role === 'ADMIN'
  const isAuthor = topic?.authorId === session?.user?.id

  const fetchTopic = useCallback(async () => {
    try {
      const response = await fetch(`/api/forum/topics/${topicId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement')
      }

      setTopic(data.topic)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [topicId])

  useEffect(() => {
    fetchTopic()
  }, [fetchTopic])

  const handlePin = async () => {
    if (!isAdmin || isPinning) return
    setIsPinning(true)

    try {
      const response = await fetch(`/api/forum/topics/${topicId}/pin`, {
        method: 'PUT',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      setTopic((prev) =>
        prev ? { ...prev, isPinned: data.topic.isPinned } : null
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setIsPinning(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce sujet et toutes ses réponses ?')) return
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/forum/topics/${topicId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      router.push(`/forum/${categoryId}`)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
      setIsDeleting(false)
    }
  }

  const handleDeleteReply = async (replyId: string) => {
    try {
      const response = await fetch(`/api/forum/topics/${topicId}/replies/${replyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      setTopic((prev) =>
        prev
          ? { ...prev, replies: prev.replies?.filter((r) => r.id !== replyId) }
          : null
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur')
    }
  }

  const handleNewReply = (reply: Reply) => {
    setTopic((prev) =>
      prev ? { ...prev, replies: [...(prev.replies || []), reply] } : null
    )
    // Scroll to the new reply
    setTimeout(() => {
      document.getElementById(`reply-${reply.id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 100)
  }

  const handleEditReply = async (replyId: string, newContent: string) => {
    const response = await fetch(`/api/forum/topics/${topicId}/replies/${replyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Erreur lors de la modification')
    }

    const updatedReply = await response.json()

    setTopic((prev) =>
      prev
        ? {
            ...prev,
            replies: prev.replies?.map((r) =>
              r.id === replyId ? { ...r, ...updatedReply } : r
            ),
          }
        : null
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-bleu" />
      </div>
    )
  }

  if (error || !topic) {
    return (
      <div className="space-y-4">
        <Link
          href={`/forum/${categoryId}`}
          className="inline-flex items-center gap-1 text-gray-600 hover:text-bleu transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux sujets
        </Link>
        <div className="card bg-red-50 border-red-200 text-red-700">
          <p>Erreur: {error || 'Sujet non trouvé'}</p>
          <button onClick={fetchTopic} className="mt-2 text-sm underline">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/forum" className="hover:text-bleu transition-colors">
          Forum
        </Link>
        <span>/</span>
        <Link
          href={`/forum/${categoryId}`}
          className="hover:text-bleu transition-colors"
        >
          {topic.category?.name}
        </Link>
      </div>

      {/* Topic header */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            {topic.isPinned && <Pin className="h-5 w-5 text-terracotta" />}
            <h1 className="text-xl font-bold">{topic.title}</h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isAdmin && (
              <button
                onClick={handlePin}
                disabled={isPinning}
                className={`p-2 rounded-lg transition-colors ${
                  topic.isPinned
                    ? 'bg-terracotta/10 text-terracotta hover:bg-terracotta/20'
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title={topic.isPinned ? 'Désépingler' : 'Épingler'}
              >
                <Pin className="h-4 w-4" />
              </button>
            )}
            {(isAdmin || isAuthor) && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <FormatContent content={topic.content} className="text-gray-700 dark:text-gray-300" />

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          Par{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {topic.author.firstName} {topic.author.lastName}
          </span>
          <span className="mx-2">•</span>
          {formatDistanceToNow(new Date(topic.createdAt), {
            addSuffix: true,
            locale: fr,
          })}
        </div>
      </div>

      {/* Replies */}
      {topic.replies && topic.replies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {topic.replies.length} réponse{topic.replies.length > 1 ? 's' : ''}
          </h2>
          {topic.replies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              onQuote={setQuotedReply}
              onDelete={handleDeleteReply}
              onEdit={handleEditReply}
              canDelete={isAdmin || reply.authorId === session?.user?.id}
              canEdit={reply.authorId === session?.user?.id}
            />
          ))}
        </div>
      )}

      {/* Reply form */}
      <ReplyForm
        topicId={topicId}
        quotedReply={quotedReply}
        onClearQuote={() => setQuotedReply(null)}
        onSuccess={handleNewReply}
      />
    </div>
  )
}

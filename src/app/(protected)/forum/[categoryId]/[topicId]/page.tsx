'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, Pin, Trash2, Pencil, Loader2, ArrowUpDown } from 'lucide-react'
import { useSession } from 'next-auth/react'
import {
  ReplyCard,
  ReplyForm,
  FormatContent,
  FormatToolbar,
  Topic,
  Reply,
} from '@/components/forum'
import { ReactionBar } from '@/components/ui/ReactionBar'

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
  const [isEditingTopic, setIsEditingTopic] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const [editError, setEditError] = useState('')
  const [sortMode, setSortMode] = useState<'recent' | 'oldest' | 'reactions'>('recent')
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  const isAdmin = session?.user?.role === 'ADMIN'
  const currentUserId = session?.user?.id
  const isAuthor = topic?.authorId === session?.user?.id

  const markAsRead = useCallback(async () => {
    try {
      await fetch(`/api/forum/topics/${topicId}/read`, { method: 'POST' })
    } catch {
      // Silently fail - not critical
    }
  }, [topicId])

  const fetchTopic = useCallback(async () => {
    try {
      const response = await fetch(`/api/forum/topics/${topicId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement')
      }

      setTopic(data.topic)
      setError(null)

      // Mark topic as read after successful fetch
      markAsRead()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [topicId, markAsRead])

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

  const handleStartEditTopic = () => {
    if (!topic) return
    setEditTitle(topic.title)
    setEditContent(topic.content)
    setEditError('')
    setIsEditingTopic(true)
  }

  const handleCancelEditTopic = () => {
    setIsEditingTopic(false)
    setEditTitle('')
    setEditContent('')
    setEditError('')
  }

  const handleSaveEditTopic = async () => {
    if (!editTitle.trim() || !editContent.trim()) return
    if (editTitle === topic?.title && editContent === topic?.content) {
      setIsEditingTopic(false)
      return
    }

    setIsSubmittingEdit(true)
    setEditError('')

    try {
      const response = await fetch(`/api/forum/topics/${topicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification')
      }

      setTopic((prev) =>
        prev ? { ...prev, ...data.topic, replies: prev.replies } : null
      )
      setIsEditingTopic(false)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Erreur lors de la modification')
    } finally {
      setIsSubmittingEdit(false)
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

  const handleTopicReactionToggle = async (emoji: string) => {
    if (!currentUserId) return
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, topicId }),
      })
      const data = await response.json()
      if (response.ok) {
        setTopic((prev) => {
          if (!prev) return null
          const reactions = prev.reactions || []
          if (data.action === 'removed') {
            return { ...prev, reactions: reactions.filter((r) => r.id !== data.reactionId) }
          } else {
            return { ...prev, reactions: [...reactions, data.reaction] }
          }
        })
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
    }
  }

  const handleReplyReactionToggle = async (replyId: string, emoji: string) => {
    if (!currentUserId) return
    try {
      const response = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, replyId }),
      })
      const data = await response.json()
      if (response.ok) {
        setTopic((prev) => {
          if (!prev) return null
          return {
            ...prev,
            replies: prev.replies?.map((r) => {
              if (r.id !== replyId) return r
              const reactions = r.reactions || []
              if (data.action === 'removed') {
                return { ...r, reactions: reactions.filter((rx) => rx.id !== data.reactionId) }
              } else {
                return { ...r, reactions: [...reactions, data.reaction] }
              }
            }),
          }
        })
      }
    } catch (error) {
      console.error('Error toggling reaction:', error)
    }
  }

  const sortedReplies = useMemo(() => {
    if (!topic?.replies) return []
    const replies = [...topic.replies]
    switch (sortMode) {
      case 'recent':
        return replies.sort((a, b) => {
          const dateA = new Date(a.editedAt ?? a.createdAt).getTime()
          const dateB = new Date(b.editedAt ?? b.createdAt).getTime()
          return dateB - dateA
        })
      case 'oldest':
        return replies.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      case 'reactions':
        return replies.sort((a, b) => {
          const diff = (b.reactions?.length || 0) - (a.reactions?.length || 0)
          if (diff !== 0) return diff
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    }
  }, [topic?.replies, sortMode])

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
        {isEditingTopic ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Titre</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bleu focus:border-transparent"
                maxLength={200}
                disabled={isSubmittingEdit}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contenu</label>
              <textarea
                ref={editTextareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bleu focus:border-transparent resize-y min-h-[150px]"
                maxLength={10000}
                disabled={isSubmittingEdit}
              />
              <FormatToolbar
                textareaRef={editTextareaRef}
                value={editContent}
                onChange={setEditContent}
                disabled={isSubmittingEdit}
              />
            </div>
            {editError && (
              <p className="text-red-500 text-sm">{editError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelEditTopic}
                disabled={isSubmittingEdit}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEditTopic}
                disabled={isSubmittingEdit || !editTitle.trim() || !editContent.trim()}
                className="px-3 py-1.5 text-sm bg-bleu text-white rounded-md hover:bg-bleu/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingEdit && <Loader2 className="h-3 w-3 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <>
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
                {isAuthor && (
                  <button
                    onClick={handleStartEditTopic}
                    className="p-2 text-gray-400 hover:text-bleu hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Pencil className="h-4 w-4" />
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

            {currentUserId && (
              <div className="mt-4">
                <ReactionBar
                  reactions={topic.reactions || []}
                  currentUserId={currentUserId}
                  targetType="topic"
                  targetId={topic.id}
                  onReactionToggle={handleTopicReactionToggle}
                />
              </div>
            )}

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
              {topic.isEdited && topic.editedAt && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-gray-400 italic">
                    (modifié {formatDistanceToNow(new Date(topic.editedAt), {
                      addSuffix: true,
                      locale: fr,
                    })})
                  </span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Reply form */}
      <ReplyForm
        topicId={topicId}
        quotedReply={quotedReply}
        onClearQuote={() => setQuotedReply(null)}
        onSuccess={handleNewReply}
      />

      {/* Replies */}
      {sortedReplies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {sortedReplies.length} réponse{sortedReplies.length > 1 ? 's' : ''}
            </h2>
            <div className="flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 mr-1" />
              {([
                ['recent', 'Récentes'],
                ['oldest', 'Anciennes'],
                ['reactions', 'Réactions'],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                    sortMode === mode
                      ? 'bg-bleu text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {sortedReplies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              onQuote={setQuotedReply}
              onDelete={handleDeleteReply}
              onEdit={handleEditReply}
              canDelete={isAdmin || reply.authorId === session?.user?.id}
              canEdit={reply.authorId === session?.user?.id}
              currentUserId={currentUserId}
              onReactionToggle={handleReplyReactionToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

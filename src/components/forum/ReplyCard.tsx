'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Quote, Trash2, Pencil, History, X, Loader2 } from 'lucide-react'
import { Reply, ReplyHistory } from './types'
import { FormatContent } from './FormatContent'

interface ReplyCardProps {
  reply: Reply
  onQuote?: (reply: Reply) => void
  onDelete?: (replyId: string) => void
  onEdit?: (replyId: string, newContent: string) => Promise<void>
  canDelete?: boolean
  canEdit?: boolean
}

export function ReplyCard({ reply, onQuote, onDelete, onEdit, canDelete, canEdit }: ReplyCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(reply.content)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<ReplyHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === reply.content) {
      setIsEditing(false)
      setEditContent(reply.content)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      if (onEdit) {
        await onEdit(reply.id, editContent.trim())
      }
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent(reply.content)
    setError('')
  }

  const fetchHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch(`/api/forum/topics/${reply.topicId}/replies/${reply.id}/history`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (err) {
      console.error('Error fetching history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleShowHistory = async () => {
    if (!showHistory && history.length === 0) {
      await fetchHistory()
    }
    setShowHistory(!showHistory)
  }

  return (
    <div className="card" id={`reply-${reply.id}`}>
      {/* Quoted reply */}
      {reply.quotedReply && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 border-l-4 border-gray-300 dark:border-gray-600 rounded text-sm">
          <div className="text-gray-500 dark:text-gray-400 mb-1">
            En réponse à {reply.quotedReply.author.firstName}:
          </div>
          <div className="text-gray-600 dark:text-gray-300 line-clamp-2">
            {reply.quotedReply.content}
          </div>
        </div>
      )}

      {/* Reply content or edit form */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bleu focus:border-transparent resize-y min-h-[100px]"
            maxLength={10000}
            disabled={isSubmitting}
          />
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleEdit}
              disabled={isSubmitting || !editContent.trim()}
              className="px-3 py-1.5 text-sm bg-bleu text-white rounded-md hover:bg-bleu/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </div>
      ) : (
        <FormatContent content={reply.content} className="text-gray-700 dark:text-gray-300" />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {reply.author.firstName} {reply.author.lastName}
          </span>
          <span className="mx-2">•</span>
          <span>
            {formatDistanceToNow(new Date(reply.createdAt), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
          {reply.isEdited && reply.editedAt && (
            <>
              <span className="mx-2">•</span>
              <span className="text-gray-400 italic">
                (modifié {formatDistanceToNow(new Date(reply.editedAt), {
                  addSuffix: true,
                  locale: fr,
                })})
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {reply.isEdited && (
            <button
              onClick={handleShowHistory}
              className="p-1.5 text-gray-400 hover:text-bleu hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Voir l'historique"
            >
              <History className="h-4 w-4" />
            </button>
          )}
          {onQuote && !isEditing && (
            <button
              onClick={() => onQuote(reply)}
              className="p-1.5 text-gray-400 hover:text-bleu hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Citer"
            >
              <Quote className="h-4 w-4" />
            </button>
          )}
          {canEdit && onEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-400 hover:text-bleu hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Modifier"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {canDelete && onDelete && !isEditing && (
            <button
              onClick={() => {
                if (confirm('Supprimer cette réponse ?')) {
                  onDelete(reply.id)
                }
              }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Historique des modifications</h4>
            <button
              onClick={() => setShowHistory(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">Aucun historique disponible</p>
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => (
                <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                  <div className="text-xs text-gray-400 mb-2">
                    Version {history.length - index} - {formatDistanceToNow(new Date(item.editedAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{item.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

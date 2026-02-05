'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2, X, AtSign } from 'lucide-react'
import { Reply } from './types'
import { FormatToolbar } from './FormatContent'
import { MentionAutocomplete } from './MentionAutocomplete'

interface ReplyFormProps {
  topicId: string
  quotedReply?: Reply | null
  onClearQuote?: () => void
  onSuccess?: (reply: Reply) => void
}

export function ReplyForm({
  topicId,
  quotedReply,
  onClearQuote,
  onSuccess,
}: ReplyFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showTagSuggestion, setShowTagSuggestion] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Show tag suggestion when quoting, hide if tag already present
  useEffect(() => {
    if (quotedReply) {
      const authorFullName = `@${quotedReply.author.firstName} ${quotedReply.author.lastName}`
      const hasTag = content.toLowerCase().includes(authorFullName.toLowerCase())
      setShowTagSuggestion(!hasTag)
    } else {
      setShowTagSuggestion(false)
    }
  }, [quotedReply, content])

  // Focus textarea when quoting
  useEffect(() => {
    if (quotedReply && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [quotedReply])

  const insertMention = () => {
    if (!quotedReply) return
    const mention = `@${quotedReply.author.firstName} ${quotedReply.author.lastName} `
    setContent((prev) => mention + prev)
    textareaRef.current?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/forum/topics/${topicId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          quotedReplyId: quotedReply?.id || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réponse')
      }

      setContent('')
      onClearQuote?.()
      onSuccess?.(data.reply)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card">
      <h3 className="font-semibold mb-4">Répondre</h3>

      {/* Quoted reply preview */}
      {quotedReply && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 border-l-4 border-bleu rounded relative">
          <button
            onClick={onClearQuote}
            className="absolute top-2 right-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            En réponse à {quotedReply.author.firstName}:
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 pr-6">
            {quotedReply.content}
          </div>

          {/* Tag suggestion */}
          {showTagSuggestion && (
            <button
              type="button"
              onClick={insertMention}
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-bleu/10 text-bleu hover:bg-bleu/20 rounded-full transition-colors"
            >
              <AtSign className="h-3 w-3" />
              Mentionner @{quotedReply.author.firstName} {quotedReply.author.lastName}
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <MentionAutocomplete
            textareaRef={textareaRef}
            value={content}
            onChange={setContent}
            className="input min-h-[120px]"
            placeholder="Écrivez votre réponse... (tapez @ pour mentionner)"
            maxLength={10000}
            disabled={isSubmitting}
          />
          <FormatToolbar />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="btn-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Envoi...
              </>
            ) : (
              'Répondre'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

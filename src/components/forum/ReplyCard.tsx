'use client'

import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Quote, Trash2 } from 'lucide-react'
import { Reply } from './types'
import { FormatContent } from './FormatContent'

interface ReplyCardProps {
  reply: Reply
  onQuote?: (reply: Reply) => void
  onDelete?: (replyId: string) => void
  canDelete?: boolean
}

export function ReplyCard({ reply, onQuote, onDelete, canDelete }: ReplyCardProps) {
  return (
    <div className="card" id={`reply-${reply.id}`}>
      {/* Quoted reply */}
      {reply.quotedReply && (
        <div className="mb-3 p-3 bg-gray-50 border-l-4 border-gray-300 rounded text-sm">
          <div className="text-gray-500 mb-1">
            En réponse à {reply.quotedReply.author.firstName}:
          </div>
          <div className="text-gray-600 line-clamp-2">
            {reply.quotedReply.content}
          </div>
        </div>
      )}

      {/* Reply content */}
      <FormatContent content={reply.content} className="text-gray-700" />

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">
            {reply.author.firstName} {reply.author.lastName}
          </span>
          <span className="mx-2">•</span>
          <span>
            {formatDistanceToNow(new Date(reply.createdAt), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onQuote && (
            <button
              onClick={() => onQuote(reply)}
              className="p-1.5 text-gray-400 hover:text-bleu hover:bg-gray-100 rounded transition-colors"
              title="Citer"
            >
              <Quote className="h-4 w-4" />
            </button>
          )}
          {canDelete && onDelete && (
            <button
              onClick={() => {
                if (confirm('Supprimer cette réponse ?')) {
                  onDelete(reply.id)
                }
              }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

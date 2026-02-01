'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Pin, MessageSquare, ChevronRight } from 'lucide-react'
import { Topic } from './types'

interface TopicCardProps {
  topic: Topic
  categoryId: string
}

export function TopicCard({ topic, categoryId }: TopicCardProps) {
  const replyCount = topic._count?.replies || 0
  const lastReply = topic.replies?.[0]

  return (
    <Link
      href={`/forum/${categoryId}/${topic.id}`}
      className="card hover:shadow-lg transition-shadow flex items-center gap-4 group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {topic.isPinned && (
            <Pin className="h-4 w-4 text-terracotta flex-shrink-0" />
          )}
          <h3 className="font-semibold group-hover:text-bleu transition-colors truncate">
            {topic.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
          <span>
            Par {topic.author.firstName} {topic.author.lastName}
          </span>
          <span>
            {formatDistanceToNow(new Date(topic.createdAt), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
        </div>

        {lastReply && (
          <div className="mt-2 text-xs text-gray-400">
            Dernière réponse par {lastReply.author.firstName},{' '}
            {formatDistanceToNow(new Date(topic.lastReplyAt), {
              addSuffix: true,
              locale: fr,
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center gap-1 text-gray-400">
          <MessageSquare className="h-4 w-4" />
          <span className="text-sm">{replyCount}</span>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-bleu transition-colors" />
      </div>
    </Link>
  )
}

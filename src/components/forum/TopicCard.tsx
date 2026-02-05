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
  const isUnread = topic.isUnread ?? false
  const unreadCount = topic.unreadRepliesCount ?? 0

  return (
    <Link
      href={`/forum/${categoryId}/${topic.id}`}
      className={`card hover:shadow-lg transition-shadow flex items-center gap-4 group ${
        isUnread ? 'border-l-4 border-l-bleu' : ''
      }`}
    >
      {/* Unread indicator dot */}
      {isUnread && (
        <div className="flex-shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-bleu" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {topic.isPinned && (
            <Pin className="h-4 w-4 text-terracotta flex-shrink-0" />
          )}
          <h3 className={`font-semibold group-hover:text-bleu transition-colors truncate ${
            isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
          }`}>
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
          {unreadCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-bleu text-white rounded-full">
              +{unreadCount}
            </span>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-bleu transition-colors" />
      </div>
    </Link>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉']

interface Reaction {
  id: string
  emoji: string
  userId: string
  user: {
    id: string
    firstName: string
    lastName: string
  }
}

interface ReactionBarProps {
  reactions: Reaction[]
  currentUserId: string
  targetType: 'topic' | 'reply' | 'photoComment'
  targetId: string
  onReactionToggle: (emoji: string) => void
}

export function ReactionBar({
  reactions,
  currentUserId,
  targetType,
  targetId,
  onReactionToggle,
}: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false)
      }
    }

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPicker])

  // Group reactions by emoji
  const groupedReactions = reactions.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = []
      }
      acc[reaction.emoji].push(reaction)
      return acc
    },
    {} as Record<string, Reaction[]>
  )

  const handleEmojiClick = (emoji: string) => {
    onReactionToggle(emoji)
    setShowPicker(false)
  }

  // Check if current user has reacted with a specific emoji
  const hasUserReacted = (emoji: string) => {
    return groupedReactions[emoji]?.some((r) => r.userId === currentUserId) ?? false
  }

  // Get tooltip text for a reaction group
  const getTooltip = (reactors: Reaction[]) => {
    return reactors.map((r) => `${r.user.firstName} ${r.user.lastName}`).join(', ')
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Existing reactions */}
      {Object.entries(groupedReactions).map(([emoji, reactors]) => (
        <button
          key={emoji}
          onClick={() => onReactionToggle(emoji)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm transition-colors ${
            hasUserReacted(emoji)
              ? 'bg-bleu/20 text-bleu border border-bleu/30'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
          }`}
          title={getTooltip(reactors)}
        >
          <span>{emoji}</span>
          <span className="text-xs font-medium">{reactors.length}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div ref={pickerRef} className="relative inline-block">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
          title="Ajouter une réaction"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {showPicker && (
          <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
            <div className="flex gap-1">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className={`p-1.5 rounded hover:bg-gray-100 text-xl transition-colors ${
                    hasUserReacted(emoji) ? 'bg-bleu/10' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

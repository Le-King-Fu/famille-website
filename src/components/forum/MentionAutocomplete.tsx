'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface User {
  id: string
  firstName: string
  lastName: string
}

interface MentionAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxLength?: number
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>
}

export function MentionAutocomplete({
  value,
  onChange,
  placeholder,
  className = '',
  disabled = false,
  maxLength,
  textareaRef: externalRef,
}: MentionAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState(-1)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const textareaRefToUse = externalRef || internalRef
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions when query changes
  useEffect(() => {
    if (mentionQuery.length < 1) {
      setSuggestions([])
      return
    }

    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(mentionQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.users)
          setSelectedIndex(0)
        }
      } catch {
        setSuggestions([])
      }
    }

    const debounce = setTimeout(fetchSuggestions, 150)
    return () => clearTimeout(debounce)
  }, [mentionQuery])

  // Detect @ mentions while typing
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart

    onChange(newValue)

    // Look for @ before cursor
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      // Check if there's a space before @ (or it's at the start)
      const charBeforeAt = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : ' '

      if ((charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0) &&
          !textAfterAt.includes(' ') &&
          !textAfterAt.includes('\n')) {
        setMentionStart(lastAtIndex)
        setMentionQuery(textAfterAt)
        setShowSuggestions(true)
        return
      }
    }

    setShowSuggestions(false)
    setMentionQuery('')
    setMentionStart(-1)
  }, [onChange])

  // Insert selected user mention
  const insertMention = useCallback((user: User) => {
    if (mentionStart === -1) return

    const mention = `@${user.firstName} ${user.lastName}`
    const before = value.slice(0, mentionStart)
    const after = value.slice(mentionStart + mentionQuery.length + 1)
    const newValue = before + mention + ' ' + after

    onChange(newValue)
    setShowSuggestions(false)
    setMentionQuery('')
    setMentionStart(-1)

    // Focus and set cursor after mention
    setTimeout(() => {
      const textarea = textareaRefToUse.current
      if (textarea) {
        const cursorPos = mentionStart + mention.length + 1
        textarea.focus()
        textarea.setSelectionRange(cursorPos, cursorPos)
      }
    }, 0)
  }, [value, onChange, mentionStart, mentionQuery, textareaRefToUse])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % suggestions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
        break
      case 'Enter':
        if (showSuggestions && suggestions[selectedIndex]) {
          e.preventDefault()
          insertMention(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowSuggestions(false)
        break
      case 'Tab':
        if (showSuggestions && suggestions[selectedIndex]) {
          e.preventDefault()
          insertMention(suggestions[selectedIndex])
        }
        break
    }
  }, [showSuggestions, suggestions, selectedIndex, insertMention])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRefToUse.current &&
        !textareaRefToUse.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [textareaRefToUse])

  return (
    <div className="relative">
      <textarea
        ref={textareaRefToUse as React.RefObject<HTMLTextAreaElement>}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        maxLength={maxLength}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-64 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {suggestions.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => insertMention(user)}
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                index === selectedIndex
                  ? 'bg-bleu/10 text-bleu'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="w-8 h-8 rounded-full bg-bleu/20 flex items-center justify-center text-bleu font-medium text-xs">
                {user.firstName[0]}{user.lastName[0]}
              </span>
              <span className="font-medium">
                {user.firstName} {user.lastName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

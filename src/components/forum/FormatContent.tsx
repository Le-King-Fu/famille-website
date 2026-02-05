'use client'

import { useMemo } from 'react'
import { EmojiPicker } from '@/components/ui/EmojiPicker'

interface FormatContentProps {
  content: string
  className?: string
}

// Format text with basic markdown-like syntax:
// ## heading -> heading style
// **bold** -> <strong>
// *italic* -> <em>
// __underline__ -> <u>
// [text](url) -> <a href="url">
// Also preserves line breaks
export function FormatContent({ content, className = '' }: FormatContentProps) {
  const formattedHtml = useMemo(() => {
    let html = content
      // Escape HTML to prevent XSS
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

    // Headings: ## text at line start
    html = html.replace(/^## (.+)$/gm, '<span class="text-lg font-bold block mt-2 mb-1">$1</span>')

    // Underline: __text__
    html = html.replace(/__(.+?)__/g, '<u>$1</u>')

    // Bold: **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

    // Italic: *text*
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

    // Links: [text](url)
    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-bleu hover:underline">$1</a>'
    )

    // Auto-link URLs
    html = html.replace(
      /(?<!["\'])(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-bleu hover:underline">$1</a>'
    )

    // Mentions: @Name or @Name Name (highlight with distinct style)
    html = html.replace(
      /@([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)?)/g,
      '<span class="text-bleu font-medium bg-bleu/10 px-1 rounded">@$1</span>'
    )

    // Line breaks
    html = html.replace(/\n/g, '<br />')

    return html
  }, [content])

  return (
    <div
      className={`whitespace-pre-wrap break-words ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  )
}

interface FormatToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

// Wrap selected text with markers or insert at cursor
function wrapSelection(
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (value: string) => void,
  prefix: string,
  suffix: string
) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = value.substring(start, end)

  const newText =
    value.substring(0, start) +
    prefix +
    selectedText +
    suffix +
    value.substring(end)

  onChange(newText)

  // Restore cursor position after the wrapped text
  requestAnimationFrame(() => {
    textarea.focus()
    if (selectedText) {
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
    } else {
      textarea.setSelectionRange(start + prefix.length, start + prefix.length)
    }
  })
}

// Insert text at cursor position
function insertAtCursor(
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (value: string) => void,
  text: string
) {
  const start = textarea.selectionStart
  const newText = value.substring(0, start) + text + value.substring(start)
  onChange(newText)

  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(start + text.length, start + text.length)
  })
}

// Insert heading at start of current line
function insertHeading(
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (value: string) => void
) {
  const start = textarea.selectionStart

  // Find start of current line
  let lineStart = start
  while (lineStart > 0 && value[lineStart - 1] !== '\n') {
    lineStart--
  }

  // Check if line already has heading
  if (value.substring(lineStart, lineStart + 3) === '## ') {
    // Remove heading
    const newText = value.substring(0, lineStart) + value.substring(lineStart + 3)
    onChange(newText)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start - 3, start - 3)
    })
  } else {
    // Add heading
    const newText = value.substring(0, lineStart) + '## ' + value.substring(lineStart)
    onChange(newText)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + 3, start + 3)
    })
  }
}

// Interactive toolbar for formatting
export function FormatToolbar({ textareaRef, value, onChange, disabled }: FormatToolbarProps) {
  const handleBold = () => {
    if (textareaRef.current) {
      wrapSelection(textareaRef.current, value, onChange, '**', '**')
    }
  }

  const handleItalic = () => {
    if (textareaRef.current) {
      wrapSelection(textareaRef.current, value, onChange, '*', '*')
    }
  }

  const handleUnderline = () => {
    if (textareaRef.current) {
      wrapSelection(textareaRef.current, value, onChange, '__', '__')
    }
  }

  const handleHeading = () => {
    if (textareaRef.current) {
      insertHeading(textareaRef.current, value, onChange)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    if (textareaRef.current) {
      insertAtCursor(textareaRef.current, value, onChange, emoji)
    }
  }

  const buttonClass = "p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-w-[28px]"

  return (
    <div className="flex items-center gap-1 border-t border-gray-200 pt-2 mt-2">
      <button
        type="button"
        onClick={handleBold}
        disabled={disabled}
        className={buttonClass}
        title="Gras (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={handleItalic}
        disabled={disabled}
        className={buttonClass}
        title="Italique (Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={handleUnderline}
        disabled={disabled}
        className={buttonClass}
        title="Souligné (Ctrl+U)"
      >
        <span className="underline">U</span>
      </button>
      <button
        type="button"
        onClick={handleHeading}
        disabled={disabled}
        className={buttonClass}
        title="Titre"
      >
        H
      </button>
      <div className="border-l border-gray-200 h-5 mx-1" />
      <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={disabled} />
      <div className="flex-1" />
      <span className="text-xs text-gray-400">@prénom pour mentionner</span>
    </div>
  )
}

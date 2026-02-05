'use client'

import { useMemo } from 'react'

interface FormatContentProps {
  content: string
  className?: string
}

// Format text with basic markdown-like syntax:
// **bold** -> <strong>
// *italic* -> <em>
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

// Toolbar for formatting hints
export function FormatToolbar() {
  return (
    <div className="text-xs text-gray-400 mt-1 space-x-3">
      <span>**gras**</span>
      <span>*italique*</span>
      <span>[texte](url)</span>
      <span>@prénom</span>
    </div>
  )
}

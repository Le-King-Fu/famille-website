'use client'

import { useCallback, useRef } from 'react'

interface MobileControlsProps {
  keys: Array<{ note: string; label: string }>
  onKeyPress: (note: string) => void
  onKeyRelease: (note: string) => void
  disabled?: boolean
}

export function MobileControls({
  keys,
  onKeyPress,
  onKeyRelease,
  disabled = false,
}: MobileControlsProps) {
  const activeKeysRef = useRef<Set<string>>(new Set())

  const handleTouchStart = useCallback((note: string) => (e: React.TouchEvent) => {
    e.preventDefault()
    if (disabled || activeKeysRef.current.has(note)) return
    activeKeysRef.current.add(note)
    onKeyPress(note)
  }, [disabled, onKeyPress])

  const handleTouchEnd = useCallback((note: string) => (e: React.TouchEvent) => {
    e.preventDefault()
    if (!activeKeysRef.current.has(note)) return
    activeKeysRef.current.delete(note)
    onKeyRelease(note)
  }, [onKeyRelease])

  const handleMouseDown = useCallback((note: string) => () => {
    if (disabled || activeKeysRef.current.has(note)) return
    activeKeysRef.current.add(note)
    onKeyPress(note)
  }, [disabled, onKeyPress])

  const handleMouseUp = useCallback((note: string) => () => {
    if (!activeKeysRef.current.has(note)) return
    activeKeysRef.current.delete(note)
    onKeyRelease(note)
  }, [onKeyRelease])

  const handleMouseLeave = useCallback((note: string) => () => {
    if (!activeKeysRef.current.has(note)) return
    activeKeysRef.current.delete(note)
    onKeyRelease(note)
  }, [onKeyRelease])

  return (
    <div className="mobile-piano flex justify-center gap-1 mt-4 md:hidden">
      {keys.map(({ note, label }) => (
        <button
          key={note}
          data-note={note}
          disabled={disabled}
          onTouchStart={handleTouchStart(note)}
          onTouchEnd={handleTouchEnd(note)}
          onTouchCancel={handleTouchEnd(note)}
          onMouseDown={handleMouseDown(note)}
          onMouseUp={handleMouseUp(note)}
          onMouseLeave={handleMouseLeave(note)}
          className="touch-key w-10 h-14 sm:w-12 sm:h-16 rounded-lg font-bold text-sm
            bg-[var(--game-bg-secondary)] text-[var(--game-text)]
            border-2 border-[var(--game-primary)]/50
            active:bg-[var(--game-primary)] active:border-[var(--game-primary)]
            active:shadow-[0_0_15px_var(--game-primary)]
            transition-all duration-75
            disabled:opacity-50 disabled:cursor-not-allowed
            select-none touch-none"
        >
          {label}
        </button>
      ))}
    </div>
  )
}

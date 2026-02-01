import { useRef, useEffect, useCallback } from 'react'
import type { GameState } from '../config'

interface GameLoopCallbacks {
  onUpdate: (deltaTime: number) => void
  onRender: () => void
}

export function useGameLoop(
  gameState: GameState,
  callbacks: GameLoopCallbacks
) {
  const frameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const callbacksRef = useRef(callbacks)

  // Keep callbacks ref updated
  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  const loop = useCallback((timestamp: number) => {
    let deltaTime = timestamp - lastTimeRef.current
    lastTimeRef.current = timestamp

    // Cap delta time to avoid jumps
    if (deltaTime > 100) {
      deltaTime = 16.67
    }

    callbacksRef.current.onUpdate(deltaTime)
    callbacksRef.current.onRender()

    frameRef.current = requestAnimationFrame(loop)
  }, [])

  useEffect(() => {
    if (gameState !== 'playing') {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = 0
      }
      return
    }

    lastTimeRef.current = performance.now()
    frameRef.current = requestAnimationFrame(loop)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [gameState, loop])
}

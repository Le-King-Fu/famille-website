// Witch Case - Audio System
// Web Audio API sounds for the Snake game

export class Audio {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private volume = 0.3
  private _muted = false

  get muted(): boolean {
    return this._muted
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  init(): boolean {
    if (this.context) return true

    try {
      this.context = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      this.masterGain = this.context.createGain()
      this.masterGain.connect(this.context.destination)
      this.masterGain.gain.value = this.volume
      return true
    } catch (error) {
      console.warn('Failed to initialize audio:', error)
      return false
    }
  }

  // ===========================================================================
  // BASIC TONE GENERATORS
  // ===========================================================================

  /**
   * Play a tone with specified wave type
   */
  private playTone(
    frequency: number,
    duration = 0.15,
    volume = 0.2,
    type: OscillatorType = 'square'
  ): void {
    if (!this.context || !this.masterGain || this._muted) return

    const oscillator = this.context.createOscillator()
    const gainNode = this.context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime)

    // Simple envelope (fast attack, decay)
    gainNode.gain.setValueAtTime(0, this.context.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration)

    oscillator.start(this.context.currentTime)
    oscillator.stop(this.context.currentTime + duration)
  }

  // ===========================================================================
  // GAME SOUNDS
  // ===========================================================================

  /**
   * Play correct letter collection sound (ascending tone)
   */
  playCollectSound(): void {
    if (!this.context || this._muted) return

    // Quick ascending notes - satisfying collect sound
    this.playTone(523.25, 0.08, 0.2, 'square') // C5
    setTimeout(() => this.playTone(659.25, 0.08, 0.15, 'square'), 40) // E5
  }

  /**
   * Play wrong letter sound (error buzz)
   */
  playErrorSound(): void {
    if (!this.context || !this.masterGain || this._muted) return

    // Dissonant buzz
    const oscillator1 = this.context.createOscillator()
    const oscillator2 = this.context.createOscillator()
    const gainNode = this.context.createGain()

    oscillator1.connect(gainNode)
    oscillator2.connect(gainNode)
    gainNode.connect(this.masterGain)

    oscillator1.type = 'sawtooth'
    oscillator2.type = 'sawtooth'
    oscillator1.frequency.setValueAtTime(150, this.context.currentTime)
    oscillator2.frequency.setValueAtTime(155, this.context.currentTime) // Slight detune for buzz

    gainNode.gain.setValueAtTime(0.15, this.context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2)

    oscillator1.start(this.context.currentTime)
    oscillator2.start(this.context.currentTime)
    oscillator1.stop(this.context.currentTime + 0.2)
    oscillator2.stop(this.context.currentTime + 0.2)
  }

  /**
   * Play bonus sound (triumphant fanfare for completing LANDRY)
   */
  playBonusSound(): void {
    if (!this.context || this._muted) return

    // Triumphant ascending arpeggio
    this.playTone(523.25, 0.12, 0.2, 'square') // C5
    setTimeout(() => this.playTone(659.25, 0.12, 0.2, 'square'), 80) // E5
    setTimeout(() => this.playTone(783.99, 0.12, 0.2, 'square'), 160) // G5
    setTimeout(() => {
      // Final chord
      this.playTone(1046.5, 0.3, 0.25, 'square') // C6
      this.playTone(1318.51, 0.3, 0.2, 'square') // E6
      this.playTone(1567.98, 0.3, 0.15, 'square') // G6
    }, 240)
  }

  /**
   * Play game over sound
   */
  playGameOverSound(): void {
    if (!this.context || this._muted) return

    // Descending sad tones
    this.playTone(440, 0.2, 0.2, 'triangle') // A4
    setTimeout(() => this.playTone(349.23, 0.2, 0.2, 'triangle'), 200) // F4
    setTimeout(() => this.playTone(293.66, 0.3, 0.2, 'triangle'), 400) // D4
    setTimeout(() => this.playTone(220, 0.5, 0.15, 'triangle'), 600) // A3
  }

  /**
   * Play direction change sound (subtle blip)
   */
  playMoveSound(): void {
    // Very subtle tick sound when changing direction
    this.playTone(800, 0.02, 0.05, 'sine')
  }

  /**
   * Play menu select sound
   */
  playSelectSound(): void {
    this.playTone(660, 0.08, 0.15, 'square')
  }

  /**
   * Play menu confirm sound
   */
  playConfirmSound(): void {
    this.playTone(880, 0.05, 0.15, 'square')
    setTimeout(() => this.playTone(1108.73, 0.1, 0.2, 'square'), 50)
  }

  // ===========================================================================
  // CONTROLS
  // ===========================================================================

  /**
   * Set muted state
   */
  setMuted(muted: boolean): void {
    this._muted = muted
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : this.volume
    }
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.setMuted(!this._muted)
    return this._muted
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.masterGain && !this._muted) {
      this.masterGain.gain.value = this.volume
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.context) {
      this.context.close()
      this.context = null
    }
  }
}

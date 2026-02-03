// Belle Bête Sage - Audio System
// Web Audio API sounds for the endless runner

export class Audio {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private ambienceInterval: ReturnType<typeof setInterval> | null = null
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

  /**
   * Play noise burst (for whoosh effects)
   */
  private playNoise(duration = 0.1, volume = 0.1): void {
    if (!this.context || !this.masterGain || this._muted) return

    const bufferSize = this.context.sampleRate * duration
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate)
    const data = buffer.getChannelData(0)

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const source = this.context.createBufferSource()
    const gainNode = this.context.createGain()
    const filter = this.context.createBiquadFilter()

    source.buffer = buffer
    filter.type = 'highpass'
    filter.frequency.value = 2000

    source.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.masterGain)

    gainNode.gain.setValueAtTime(volume, this.context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration)

    source.start(this.context.currentTime)
  }

  // ===========================================================================
  // GAME SOUNDS
  // ===========================================================================

  /**
   * Play coin collection sound (ascending tone)
   */
  playCoinSound(): void {
    if (!this.context || this._muted) return

    // Quick ascending notes
    this.playTone(880, 0.06, 0.2, 'square') // A5
    setTimeout(() => this.playTone(1108.73, 0.08, 0.15, 'square'), 30) // C#6
  }

  /**
   * Play bonus collection sound (triumphant arpeggio)
   */
  playBonusSound(): void {
    if (!this.context || this._muted) return

    // Ascending arpeggio
    this.playTone(523.25, 0.08, 0.2, 'square') // C5
    setTimeout(() => this.playTone(659.25, 0.08, 0.2, 'square'), 50) // E5
    setTimeout(() => this.playTone(783.99, 0.08, 0.2, 'square'), 100) // G5
    setTimeout(() => this.playTone(1046.5, 0.15, 0.25, 'square'), 150) // C6
  }

  /**
   * Play collision/hit sound (dissonant)
   */
  playHitSound(): void {
    if (!this.context || !this.masterGain || this._muted) return

    // Dissonant chord
    const oscillator1 = this.context.createOscillator()
    const oscillator2 = this.context.createOscillator()
    const gainNode = this.context.createGain()

    oscillator1.connect(gainNode)
    oscillator2.connect(gainNode)
    gainNode.connect(this.masterGain)

    oscillator1.type = 'sawtooth'
    oscillator2.type = 'sawtooth'
    oscillator1.frequency.setValueAtTime(110, this.context.currentTime) // A2
    oscillator2.frequency.setValueAtTime(116.54, this.context.currentTime) // A#2 (dissonant)

    // Descending pitch for impact feel
    oscillator1.frequency.linearRampToValueAtTime(80, this.context.currentTime + 0.15)
    oscillator2.frequency.linearRampToValueAtTime(85, this.context.currentTime + 0.15)

    gainNode.gain.setValueAtTime(0.2, this.context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2)

    oscillator1.start(this.context.currentTime)
    oscillator2.start(this.context.currentTime)
    oscillator1.stop(this.context.currentTime + 0.2)
    oscillator2.stop(this.context.currentTime + 0.2)
  }

  /**
   * Play jump sound (whoosh with rising pitch)
   */
  playJumpSound(): void {
    if (!this.context || !this.masterGain || this._muted) return

    // Rising pitch whoosh
    const oscillator = this.context.createOscillator()
    const gainNode = this.context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(200, this.context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(600, this.context.currentTime + 0.15)

    gainNode.gain.setValueAtTime(0.1, this.context.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.05, this.context.currentTime + 0.08)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15)

    oscillator.start(this.context.currentTime)
    oscillator.stop(this.context.currentTime + 0.15)

    // Add noise whoosh
    this.playNoise(0.1, 0.05)
  }

  /**
   * Play lane change sound (quick blip)
   */
  playLaneChangeSound(): void {
    this.playTone(440, 0.05, 0.1, 'sine') // A4
  }

  /**
   * Play level up sound (fanfare)
   */
  playLevelUpSound(): void {
    if (!this.context || this._muted) return

    // Triumphant fanfare
    this.playTone(523.25, 0.15, 0.2, 'square') // C5
    setTimeout(() => this.playTone(659.25, 0.15, 0.2, 'square'), 150) // E5
    setTimeout(() => this.playTone(783.99, 0.15, 0.2, 'square'), 300) // G5
    setTimeout(() => {
      // Final chord
      this.playTone(1046.5, 0.3, 0.25, 'square') // C6
      this.playTone(1318.51, 0.3, 0.2, 'square') // E6
      this.playTone(1567.98, 0.3, 0.15, 'square') // G6
    }, 450)
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
  // AMBIENT SOUNDS
  // ===========================================================================

  /**
   * Start cyberpunk ambient sounds (subtle electronic hum)
   */
  startAmbience(): void {
    this.stopAmbience()

    // Periodic subtle sounds
    this.ambienceInterval = setInterval(() => {
      if (this._muted || !this.context) return

      // Random chance to play ambient sound
      if (Math.random() < 0.3) {
        const freq = 100 + Math.random() * 50
        this.playTone(freq, 0.5, 0.02, 'sine')
      }
    }, 2000)
  }

  /**
   * Stop ambient sounds
   */
  stopAmbience(): void {
    if (this.ambienceInterval) {
      clearInterval(this.ambienceInterval)
      this.ambienceInterval = null
    }
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
    this.stopAmbience()
    if (this.context) {
      this.context.close()
      this.context = null
    }
  }
}

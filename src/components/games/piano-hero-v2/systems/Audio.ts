import { NOTE_FREQ, MELODY, type NoteType } from '../config'

export class Audio {
  private context: AudioContext | null = null
  private masterGain: GainNode | null = null
  private melodyInterval: ReturnType<typeof setInterval> | null = null
  private melodyIndex = 0
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
      this.context = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      this.masterGain = this.context.createGain()
      this.masterGain.connect(this.context.destination)
      this.masterGain.gain.value = this.volume
      return true
    } catch (error) {
      console.warn('Failed to initialize audio:', error)
      return false
    }
  }

  /**
   * Play a tone with square wave (8-bit sound)
   */
  private playTone(frequency: number, duration = 0.15, volume = 0.2): void {
    if (!this.context || !this.masterGain || this._muted) return

    const oscillator = this.context.createOscillator()
    const gainNode = this.context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)

    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime)

    // Simple envelope (fast attack, decay)
    gainNode.gain.setValueAtTime(0, this.context.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration)

    oscillator.start(this.context.currentTime)
    oscillator.stop(this.context.currentTime + duration)
  }

  /**
   * Play a piano note
   */
  playNote(note: NoteType): void {
    const freq = NOTE_FREQ[note]
    if (freq) {
      this.playTone(freq, 0.15, 0.25)
    }
  }

  /**
   * Play hit sound
   */
  playHitSound(note: NoteType): void {
    const freq = NOTE_FREQ[note]
    if (freq) {
      this.playTone(freq, 0.1, 0.3)
    }
  }

  /**
   * Play bonus sound (ascending arpeggio)
   */
  playBonusSound(): void {
    if (!this.context || this._muted) return

    this.playTone(523.25, 0.08, 0.2) // C5
    setTimeout(() => this.playTone(659.25, 0.08, 0.2), 40) // E5
    setTimeout(() => this.playTone(783.99, 0.12, 0.25), 80) // G5
  }

  /**
   * Play miss sound (dissonant)
   */
  playMissSound(): void {
    if (!this.context || !this.masterGain || this._muted) return

    const oscillator1 = this.context.createOscillator()
    const oscillator2 = this.context.createOscillator()
    const gainNode = this.context.createGain()

    oscillator1.connect(gainNode)
    oscillator2.connect(gainNode)
    gainNode.connect(this.masterGain)

    oscillator1.type = 'sawtooth'
    oscillator2.type = 'sawtooth'
    oscillator1.frequency.setValueAtTime(110, this.context.currentTime)
    oscillator2.frequency.setValueAtTime(117, this.context.currentTime)

    gainNode.gain.setValueAtTime(0.15, this.context.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2)

    oscillator1.start(this.context.currentTime)
    oscillator2.start(this.context.currentTime)
    oscillator1.stop(this.context.currentTime + 0.2)
    oscillator2.stop(this.context.currentTime + 0.2)
  }

  /**
   * Play a melody tone (triangle wave - softer)
   */
  private playMelodyTone(frequency: number, duration = 0.5, volume = 0.1): void {
    if (!this.context || !this.masterGain || this._muted) return

    const oscillator = this.context.createOscillator()
    const gainNode = this.context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)

    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime)

    // Soft envelope
    gainNode.gain.setValueAtTime(0, this.context.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + 0.05)
    gainNode.gain.setValueAtTime(volume, this.context.currentTime + duration * 0.6)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration)

    oscillator.start(this.context.currentTime)
    oscillator.stop(this.context.currentTime + duration)
  }

  /**
   * Start background melody
   */
  startMelody(interval = 500): void {
    this.stopMelody()
    this.melodyIndex = 0

    this.melodyInterval = setInterval(() => {
      if (this._muted) return

      const note = MELODY[this.melodyIndex]
      const freq = NOTE_FREQ[note]
      if (freq) {
        this.playMelodyTone(freq, 0.45, 0.12)
      }
      this.melodyIndex = (this.melodyIndex + 1) % MELODY.length
    }, interval)
  }

  /**
   * Stop background melody
   */
  stopMelody(): void {
    if (this.melodyInterval) {
      clearInterval(this.melodyInterval)
      this.melodyInterval = null
    }
  }

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
   * Set volume
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
    this.stopMelody()
    if (this.context) {
      this.context.close()
      this.context = null
    }
  }
}

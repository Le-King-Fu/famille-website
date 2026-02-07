// =============================================================================
// Tête de Soccer - Web Audio API Sound Effects
// =============================================================================

type WaveType = OscillatorType

export class Audio {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private muted = false
  private initialized = false

  init(): void {
    if (this.initialized) return
    try {
      this.ctx = new AudioContext()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.3
      this.masterGain.connect(this.ctx.destination)
      this.initialized = true
    } catch {
      // Web Audio not supported
    }
  }

  destroy(): void {
    this.ctx?.close()
    this.ctx = null
    this.masterGain = null
    this.initialized = false
  }

  toggleMute(): boolean {
    this.muted = !this.muted
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.3
    }
    return this.muted
  }

  private playTone(freq: number, duration: number, volume: number, type: WaveType = 'square'): void {
    if (!this.ctx || !this.masterGain) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = volume
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start()
    osc.stop(this.ctx.currentTime + duration)
  }

  private playNoise(duration: number, volume: number): void {
    if (!this.ctx || !this.masterGain) return
    const bufferSize = this.ctx.sampleRate * duration
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    const gain = this.ctx.createGain()
    gain.gain.value = volume
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 2000
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)
    source.start()
  }

  // Paddle bounce: short rising tone
  playPaddleBounce(): void {
    this.playTone(440, 0.08, 0.4, 'square')
    this.playTone(660, 0.06, 0.3, 'sine')
  }

  // Wall bounce: subtle click
  playWallBounce(): void {
    this.playTone(300, 0.04, 0.15, 'square')
  }

  // Brick destroy: satisfying tone (varies by type)
  playBrickDestroy(type: string): void {
    switch (type) {
      case 'G': // Grey
        this.playTone(523, 0.1, 0.3, 'square')
        break
      case 'O': // Orange - arpeggio
        this.playTone(523, 0.08, 0.3, 'square')
        setTimeout(() => this.playTone(659, 0.08, 0.25, 'square'), 40)
        setTimeout(() => this.playTone(784, 0.12, 0.3, 'sine'), 80)
        break
      case 'R': // Red - explosive
        this.playNoise(0.15, 0.3)
        this.playTone(150, 0.2, 0.4, 'sawtooth')
        break
      case 'V': // Green - pleasant chime
        this.playTone(784, 0.1, 0.3, 'sine')
        setTimeout(() => this.playTone(988, 0.12, 0.3, 'sine'), 60)
        setTimeout(() => this.playTone(1175, 0.15, 0.25, 'sine'), 120)
        break
      case 'B': // Blue - watery
        this.playTone(600, 0.15, 0.3, 'sine')
        this.playTone(800, 0.1, 0.2, 'triangle')
        break
      default:
        this.playTone(523, 0.1, 0.3, 'square')
    }
  }

  // Brick hit but not destroyed (black)
  playBrickHit(): void {
    this.playTone(200, 0.05, 0.2, 'square')
  }

  // Life lost: sad descending
  playLifeLost(): void {
    this.playTone(440, 0.15, 0.4, 'sawtooth')
    setTimeout(() => this.playTone(349, 0.15, 0.35, 'sawtooth'), 150)
    setTimeout(() => this.playTone(262, 0.25, 0.3, 'sawtooth'), 300)
  }

  // Level up: fanfare
  playLevelUp(): void {
    this.playTone(523, 0.1, 0.3, 'square')
    setTimeout(() => this.playTone(659, 0.1, 0.3, 'square'), 100)
    setTimeout(() => this.playTone(784, 0.1, 0.3, 'square'), 200)
    setTimeout(() => {
      this.playTone(1047, 0.2, 0.35, 'square')
      this.playTone(784, 0.2, 0.2, 'sine')
      this.playTone(659, 0.2, 0.15, 'sine')
    }, 300)
  }

  // Game over: descending sequence
  playGameOver(): void {
    this.playTone(440, 0.2, 0.35, 'sawtooth')
    setTimeout(() => this.playTone(349, 0.2, 0.3, 'sawtooth'), 200)
    setTimeout(() => this.playTone(293, 0.2, 0.25, 'sawtooth'), 400)
    setTimeout(() => this.playTone(220, 0.4, 0.3, 'sawtooth'), 600)
  }

  // Victory: triumphant fanfare
  playVictory(): void {
    this.playTone(523, 0.12, 0.3, 'square')
    setTimeout(() => this.playTone(659, 0.12, 0.3, 'square'), 120)
    setTimeout(() => this.playTone(784, 0.12, 0.3, 'square'), 240)
    setTimeout(() => this.playTone(1047, 0.15, 0.35, 'square'), 360)
    setTimeout(() => {
      this.playTone(1047, 0.3, 0.35, 'sine')
      this.playTone(784, 0.3, 0.25, 'sine')
      this.playTone(523, 0.3, 0.2, 'sine')
    }, 500)
  }

  // Launch ball
  playLaunch(): void {
    this.playTone(350, 0.08, 0.25, 'sine')
    this.playTone(500, 0.06, 0.2, 'sine')
  }

  // Select UI sound
  playSelect(): void {
    this.playTone(600, 0.05, 0.2, 'square')
  }
}

/** Small touches that make key moments feel good: a haptic buzz and a short chime. Both are safe to call anywhere. */

export function haptic(pattern: number | number[] = 12) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  navigator.vibrate(pattern)
}

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext }

// Rising major arpeggio, then a soft top note. Synthesised, so there is no audio file to load.
const celebrationNotes = [
  { freq: 523.25, at: 0, length: 0.22 },
  { freq: 659.25, at: 0.09, length: 0.22 },
  { freq: 783.99, at: 0.18, length: 0.24 },
  { freq: 1046.5, at: 0.3, length: 0.7 },
]

export function playCelebrationChime() {
  if (typeof window === 'undefined') return
  const Ctx = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
  if (!Ctx) return
  try {
    const ctx = new Ctx()
    const now = ctx.currentTime
    for (const note of celebrationNotes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = note.freq
      gain.gain.setValueAtTime(0.0001, now + note.at)
      gain.gain.exponentialRampToValueAtTime(0.18, now + note.at + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.length)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + note.at)
      osc.stop(now + note.at + note.length + 0.05)
    }
    window.setTimeout(() => ctx.close().catch(() => {}), 1600)
  } catch {
    // Audio can be blocked until the user interacts; the visual celebration still plays.
  }
}

export function playTick() {
  if (typeof window === 'undefined') return
  const Ctx = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
  if (!Ctx) return
  try {
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.16)
    window.setTimeout(() => ctx.close().catch(() => {}), 400)
  } catch {
    // Ignore: audio is optional.
  }
}

/** Resizes a chosen picture so it stays light enough to keep in the app, and returns it as a data URL. */
export function readPhotoAsDataUrl(file: File, maxSize = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that picture'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file is not a picture'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Could not process that picture'))
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

/** A whistle, a boom and a crackle, four times over, then the celebration chime. Synthesised, so no audio file is needed. */
export function playFireworks() {
  if (typeof window === 'undefined') return
  const Ctx = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
  if (!Ctx) return
  try {
    const ctx = new Ctx()
    const master = ctx.createGain()
    master.gain.value = 0.55
    master.connect(ctx.destination)

    const noise = (length: number) => {
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
      const source = ctx.createBufferSource()
      source.buffer = buffer
      return source
    }

    const burst = (at: number) => {
      const whistle = ctx.createOscillator()
      const whistleGain = ctx.createGain()
      whistle.type = 'sine'
      whistle.frequency.setValueAtTime(420, at)
      whistle.frequency.exponentialRampToValueAtTime(1900, at + 0.32)
      whistleGain.gain.setValueAtTime(0.0001, at)
      whistleGain.gain.exponentialRampToValueAtTime(0.08, at + 0.05)
      whistleGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.34)
      whistle.connect(whistleGain).connect(master)
      whistle.start(at)
      whistle.stop(at + 0.36)

      const boomAt = at + 0.34
      const boom = noise(0.7)
      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.setValueAtTime(1400, boomAt)
      lowpass.frequency.exponentialRampToValueAtTime(120, boomAt + 0.6)
      const boomGain = ctx.createGain()
      boomGain.gain.setValueAtTime(0.0001, boomAt)
      boomGain.gain.exponentialRampToValueAtTime(0.9, boomAt + 0.015)
      boomGain.gain.exponentialRampToValueAtTime(0.0001, boomAt + 0.65)
      boom.connect(lowpass).connect(boomGain).connect(master)
      boom.start(boomAt)

      const thump = ctx.createOscillator()
      const thumpGain = ctx.createGain()
      thump.frequency.setValueAtTime(110, boomAt)
      thump.frequency.exponentialRampToValueAtTime(40, boomAt + 0.4)
      thumpGain.gain.setValueAtTime(0.0001, boomAt)
      thumpGain.gain.exponentialRampToValueAtTime(0.6, boomAt + 0.01)
      thumpGain.gain.exponentialRampToValueAtTime(0.0001, boomAt + 0.45)
      thump.connect(thumpGain).connect(master)
      thump.start(boomAt)
      thump.stop(boomAt + 0.5)

      for (let i = 0; i < 9; i++) {
        const t = boomAt + 0.12 + i * 0.07 + Math.random() * 0.05
        const crackle = noise(0.05)
        const highpass = ctx.createBiquadFilter()
        highpass.type = 'highpass'
        highpass.frequency.value = 3500 + Math.random() * 3000
        const crackleGain = ctx.createGain()
        crackleGain.gain.setValueAtTime(0.0001, t)
        crackleGain.gain.exponentialRampToValueAtTime(0.25, t + 0.004)
        crackleGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
        crackle.connect(highpass).connect(crackleGain).connect(master)
        crackle.start(t)
      }
    }

    ;[0, 0.55, 1.15, 1.8].forEach(burst)
    window.setTimeout(playCelebrationChime, 2300)
    window.setTimeout(() => ctx.close().catch(() => {}), 4200)
  } catch {
    // Audio can be blocked until the customer interacts; the visual celebration still plays.
  }
}

/** A burst of applause with a couple of cheers over the top. Synthesised from filtered noise, so there is no audio file to load. */
export function playApplause() {
  if (typeof window === 'undefined') return
  const Ctx = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
  if (!Ctx) return
  try {
    const ctx = new Ctx()
    const now = ctx.currentTime
    const length = 2.2
    const noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * length), ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

    // Claps: short bandpassed noise bursts that swell, hold, then thin out.
    for (let i = 0; i < 34; i++) {
      const at = 0.04 + i * 0.058 + Math.random() * 0.04
      const swell = Math.min(1, at / 0.35) * (at > 1.5 ? Math.max(0.15, 1 - (at - 1.5) / 0.7) : 1)
      const src = ctx.createBufferSource()
      src.buffer = noise
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1500 + Math.random() * 2200
      filter.Q.value = 0.9
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, now + at)
      gain.gain.exponentialRampToValueAtTime(0.32 * swell + 0.01, now + at + 0.004)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.07)
      src.connect(filter).connect(gain).connect(ctx.destination)
      src.start(now + at, Math.random() * (length - 0.2), 0.1)
    }

    // Cheers: a rising "woo" through two vowel-like filters.
    for (const [at, from, to] of [[0.12, 300, 560], [0.5, 340, 640]] as const) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(from, now + at)
      osc.frequency.exponentialRampToValueAtTime(to, now + at + 0.55)
      const f1 = ctx.createBiquadFilter()
      f1.type = 'bandpass'
      f1.frequency.value = 700
      f1.Q.value = 4
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, now + at)
      gain.gain.exponentialRampToValueAtTime(0.07, now + at + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.7)
      osc.connect(f1).connect(gain).connect(ctx.destination)
      osc.start(now + at)
      osc.stop(now + at + 0.75)
    }
    window.setTimeout(() => ctx.close().catch(() => {}), (length + 0.5) * 1000)
  } catch {
    // Audio can be blocked until the user interacts; the visual celebration still plays.
  }
}

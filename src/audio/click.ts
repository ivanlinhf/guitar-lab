import { ensureAudio } from './guitarTone.ts'

/** Short metronome click frequency (Hz). */
export const CLICK_FREQUENCY_HZ = 1000

/** Click duration before gain reaches silence (seconds). */
export const CLICK_DURATION_SEC = 0.03

export type PlayClickOptions = {
  /**
   * AudioContext time to start the click.
   * Defaults to `ctx.currentTime` when omitted.
   */
  when?: number
}

/**
 * Play a short Web Audio click (metronome tick).
 * Triggerable alone; callers schedule beats separately.
 */
export async function playClick(options: PlayClickOptions = {}): Promise<void> {
  const ctx = await ensureAudio()
  const now = options.when ?? ctx.currentTime
  const attack = 0.001
  const stopAt = now + CLICK_DURATION_SEC

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(CLICK_FREQUENCY_HZ, now)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.5, now + attack)
  gain.gain.exponentialRampToValueAtTime(0.001, stopAt)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(now)
  osc.stop(stopAt + 0.01)
  osc.onended = () => {
    osc.disconnect()
    gain.disconnect()
  }
}

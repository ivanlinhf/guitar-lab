import type { GuitarString } from '../domain/score/types.ts'

/** Standard tuning open-string MIDI numbers: string 1 = high E. */
const OPEN_STRING_MIDI: Record<GuitarString, number> = {
  1: 64, // E4
  2: 59, // B3
  3: 55, // G3
  4: 50, // D3
  5: 45, // A2
  6: 40, // E2
}

export type PlayGuitarNoteOptions = {
  string: GuitarString
  fret: number
  durationSec: number
}

let sharedContext: AudioContext | null = null

/** MIDI note number → frequency in Hz (A4 = 440). */
export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

/** Map guitar string + fret to frequency under standard tuning. */
export function noteFrequency(string: GuitarString, fret: number): number {
  return midiToFrequency(OPEN_STRING_MIDI[string] + fret)
}

/** Lazily create / resume the shared AudioContext. */
export async function ensureAudio(): Promise<AudioContext> {
  const AudioContextCtor =
    globalThis.AudioContext ??
    (
      globalThis as typeof globalThis & {
        webkitAudioContext?: typeof AudioContext
      }
    ).webkitAudioContext

  if (!AudioContextCtor) {
    throw new Error('Web Audio API is not available in this environment')
  }

  if (!sharedContext || sharedContext.state === 'closed') {
    sharedContext = new AudioContextCtor()
  }

  if (sharedContext.state === 'suspended') {
    await sharedContext.resume()
  }

  return sharedContext
}

/** Reset the shared context (tests / teardown). */
export async function closeAudio(): Promise<void> {
  if (sharedContext && sharedContext.state !== 'closed') {
    await sharedContext.close()
  }
  sharedContext = null
}

/**
 * Play a short plucked-synth note for the given string and fret.
 * Callers skip rests; this module only sounds when invoked.
 */
export async function playGuitarNote(
  options: PlayGuitarNoteOptions,
): Promise<void> {
  const { string, fret, durationSec } = options
  const ctx = await ensureAudio()
  const freq = noteFrequency(string, fret)
  const now = ctx.currentTime
  const attack = 0.005
  const release = Math.max(0.02, Math.min(durationSec * 0.35, 0.25))
  const stopAt = now + Math.max(durationSec, attack + release)

  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq, now)

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.35, now + attack)
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

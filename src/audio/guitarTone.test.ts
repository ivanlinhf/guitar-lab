import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  installFakeAudioContext,
  type InstalledFakeAudio,
} from './fakeAudioContext.ts'
import {
  closeAudio,
  midiToFrequency,
  noteFrequency,
  playGuitarNote,
} from './guitarTone.ts'

describe('midiToFrequency', () => {
  it('maps A4 (MIDI 69) to 440 Hz', () => {
    expect(midiToFrequency(69)).toBe(440)
  })

  it('maps A3 (MIDI 57) to 220 Hz', () => {
    expect(midiToFrequency(57)).toBe(220)
  })
})

describe('noteFrequency', () => {
  it('uses standard open-string pitches (string 1 = high E)', () => {
    expect(noteFrequency(1, 0)).toBeCloseTo(midiToFrequency(64), 10)
    expect(noteFrequency(2, 0)).toBeCloseTo(midiToFrequency(59), 10)
    expect(noteFrequency(3, 0)).toBeCloseTo(midiToFrequency(55), 10)
    expect(noteFrequency(4, 0)).toBeCloseTo(midiToFrequency(50), 10)
    expect(noteFrequency(5, 0)).toBe(110)
    expect(noteFrequency(6, 0)).toBeCloseTo(midiToFrequency(40), 10)
  })

  it('raises one octave at fret 12', () => {
    for (const string of [1, 2, 3, 4, 5, 6] as const) {
      expect(noteFrequency(string, 12)).toBeCloseTo(
        noteFrequency(string, 0) * 2,
        10,
      )
    }
  })

  it('maps string 1 fret 5 to A4', () => {
    expect(noteFrequency(1, 5)).toBe(440)
  })

  it('maps string 6 fret 5 to A2', () => {
    expect(noteFrequency(6, 5)).toBe(110)
  })
})

describe('playGuitarNote without Web Audio', () => {
  afterEach(async () => {
    await closeAudio()
  })

  it('rejects when Web Audio is unavailable', async () => {
    await expect(
      playGuitarNote({ string: 1, fret: 5, durationSec: 0.5 }),
    ).rejects.toThrow(/Web Audio/)
  })
})

describe('playGuitarNote with mock AudioContext', () => {
  let fake: InstalledFakeAudio

  beforeEach(() => {
    fake = installFakeAudioContext({ currentTime: 2 })
  })

  afterEach(async () => {
    await closeAudio()
    fake.restore()
  })

  it('schedules at expected frequency for string 1 fret 5 (A4 = 440 Hz)', async () => {
    await playGuitarNote({ string: 1, fret: 5, durationSec: 0.5 })

    const ctx = fake.getContext()
    expect(ctx).not.toBeNull()
    const osc = ctx!.oscillators[0]!
    const gain = ctx!.gains[0]!
    const expected = noteFrequency(1, 5)
    expect(osc.frequency.valueAtTimes[0]?.value).toBeCloseTo(expected, 10)
    expect(expected).toBe(440)
    expect(osc.connectedTo).toContain(gain)
    expect(gain.connectedTo).toContain(ctx!.destination)
    expect(osc.startTimes).toEqual([2])
  })

  it('schedules open string 6 (low E) at noteFrequency(6, 0)', async () => {
    await playGuitarNote({ string: 6, fret: 0, durationSec: 0.25 })

    const osc = fake.getContext()!.oscillators[0]!
    expect(osc.frequency.valueAtTimes[0]?.value).toBeCloseTo(
      noteFrequency(6, 0),
      10,
    )
    expect(osc.startTimes).toEqual([2])
  })
})

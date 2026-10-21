import { describe, expect, it } from 'vitest'
import { midiToFrequency, noteFrequency } from './guitarTone.ts'

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

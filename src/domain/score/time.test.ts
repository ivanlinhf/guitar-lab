import { describe, expect, it } from 'vitest'
import openStringsJson from '../../songs/open-strings.json'
import { parseSongDocument } from './schema.ts'
import {
  absoluteBeat,
  beatToSeconds,
  beatsPerMeasure,
  effectiveBpm,
  secondsToBeat,
  songLengthBeats,
} from './time.ts'

const song = parseSongDocument(openStringsJson)

describe('beatsPerMeasure', () => {
  it('uses timeSignature.numerator', () => {
    expect(beatsPerMeasure(song)).toBe(4)
  })
})

describe('absoluteBeat', () => {
  it('maps measure 1 beat 0 to 0', () => {
    expect(absoluteBeat(song, 1, 0)).toBe(0)
  })

  it('maps measure 1 beat 2 to 2', () => {
    expect(absoluteBeat(song, 1, 2)).toBe(2)
  })

  it('maps measure 2 beat 0 to one full measure', () => {
    expect(absoluteBeat(song, 2, 0)).toBe(4)
  })

  it('maps measure 2 beat 0.5 correctly', () => {
    expect(absoluteBeat(song, 2, 0.5)).toBe(4.5)
  })
})

describe('songLengthBeats', () => {
  it('is measures × beatsPerMeasure', () => {
    expect(songLengthBeats(song)).toBe(8)
  })
})

describe('beatToSeconds / secondsToBeat', () => {
  it('uses effectiveBpm = bpm * tempoRatio', () => {
    expect(effectiveBpm(80, 1)).toBe(80)
    expect(effectiveBpm(80, 0.5)).toBe(40)
  })

  it('converts absolute beat to seconds at tempoRatio 1', () => {
    // 80 BPM → 0.75 s per beat; 4 beats → 3 s
    expect(beatToSeconds(4, 80, 1)).toBeCloseTo(3)
  })

  it('slows time when tempoRatio is 0.5', () => {
    // effective 40 BPM → 1.5 s per beat; 4 beats → 6 s
    expect(beatToSeconds(4, 80, 0.5)).toBeCloseTo(6)
  })

  it('inverts beatToSeconds', () => {
    const seconds = beatToSeconds(4.5, 80, 0.75)
    expect(secondsToBeat(seconds, 80, 0.75)).toBeCloseTo(4.5)
  })
})

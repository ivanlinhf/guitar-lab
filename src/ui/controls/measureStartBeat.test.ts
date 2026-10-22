import { describe, expect, it } from 'vitest'
import eightBarDrillJson from '../../songs/eight-bar-drill.json'
import openStringsJson from '../../songs/open-strings.json'
import { parseSongDocument } from '../../domain/score/schema.ts'
import { absoluteBeat, songLengthBeats } from '../../domain/score/index.ts'
import { measureStartBeat } from './measureStartBeat.ts'

const openStrings = parseSongDocument(openStringsJson)
const eightBar = parseSongDocument(eightBarDrillJson)

describe('measureStartBeat', () => {
  it('maps measure 1 to absolute beat 0', () => {
    expect(measureStartBeat(openStrings, 1)).toBe(
      absoluteBeat(openStrings, 1, 0),
    )
    expect(measureStartBeat(openStrings, 1)).toBe(0)
  })

  it('maps the last measure to that measure start', () => {
    expect(measureStartBeat(openStrings, 2)).toBe(
      absoluteBeat(openStrings, 2, 0),
    )
    expect(measureStartBeat(openStrings, 2)).toBe(4)
    expect(measureStartBeat(eightBar, 8)).toBe(absoluteBeat(eightBar, 8, 0))
    expect(measureStartBeat(eightBar, 8)).toBe(28)
  })

  it('clamps below 1 to measure 1', () => {
    expect(measureStartBeat(openStrings, 0)).toBe(0)
    expect(measureStartBeat(openStrings, -5)).toBe(0)
  })

  it('clamps past the last measure to the last measure start', () => {
    expect(measureStartBeat(openStrings, 99)).toBe(4)
    expect(measureStartBeat(eightBar, 100)).toBe(28)
    expect(measureStartBeat(openStrings, 99)).toBeLessThan(
      songLengthBeats(openStrings),
    )
  })

  it('truncates non-integer measure indices toward zero before clamp', () => {
    expect(measureStartBeat(eightBar, 3.9)).toBe(absoluteBeat(eightBar, 3, 0))
  })
})

import { describe, expect, it } from 'vitest'
import cAmSwitchJson from '../../songs/c-am-switch.json'
import openStringsJson from '../../songs/open-strings.json'
import { parseSongDocument } from './schema.ts'
import type { SongDocument } from './types.ts'

function cloneValid(): SongDocument {
  return structuredClone(openStringsJson) as SongDocument
}

describe('parseSongDocument', () => {
  it('accepts open-strings fixture', () => {
    const doc = parseSongDocument(openStringsJson)
    expect(doc.id).toBe('open-strings')
    expect(doc.formatVersion).toBe(1)
  })

  it('accepts c-am-switch fixture', () => {
    const doc = parseSongDocument(cAmSwitchJson)
    expect(doc.id).toBe('c-am-switch')
    expect(doc.formatVersion).toBe(1)
  })

  it('rejects wrong formatVersion', () => {
    const input = { ...cloneValid(), formatVersion: 2 }
    expect(() => parseSongDocument(input)).toThrow(/formatVersion/i)
  })

  it('rejects tuning length ≠ 6', () => {
    const input = { ...cloneValid(), tuning: ['E4', 'B3', 'G3', 'D3', 'A2'] }
    expect(() => parseSongDocument(input)).toThrow(/tuning/i)
  })

  it('rejects measures index not starting at 1', () => {
    const input = cloneValid()
    input.measures[0]!.index = 2
    input.measures[1]!.index = 3
    expect(() => parseSongDocument(input)).toThrow(/index/i)
  })

  it('rejects measures index not consecutive', () => {
    const input = cloneValid()
    input.measures[1]!.index = 3
    expect(() => parseSongDocument(input)).toThrow(/index/i)
  })

  it('rejects note out of measure (beat + durationBeats > numerator)', () => {
    const input = cloneValid()
    input.measures[0]!.events = [
      { type: 'note', beat: 3, durationBeats: 2, string: 1, fret: 0 },
    ]
    expect(() => parseSongDocument(input)).toThrow(/beat \+ durationBeats|numerator/i)
  })

  it('rejects illegal string', () => {
    const input = cloneValid()
    input.measures[0]!.events = [
      { type: 'note', beat: 0, durationBeats: 1, string: 7 as 1, fret: 0 },
    ]
    expect(() => parseSongDocument(input)).toThrow(/string/i)
  })

  it('rejects non-integer fret', () => {
    const input = cloneValid()
    input.measures[0]!.events = [
      { type: 'note', beat: 0, durationBeats: 1, string: 1, fret: 1.5 },
    ]
    expect(() => parseSongDocument(input)).toThrow(/fret/i)
  })

  it('rejects negative fret', () => {
    const input = cloneValid()
    input.measures[0]!.events = [
      { type: 'note', beat: 0, durationBeats: 1, string: 1, fret: -1 },
    ]
    expect(() => parseSongDocument(input)).toThrow(/fret/i)
  })
})

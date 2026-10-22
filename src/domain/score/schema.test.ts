import { describe, expect, it } from 'vitest'
import cAmSwitchJson from '../../songs/c-am-switch.json'
import eightBarDrillJson from '../../songs/eight-bar-drill.json'
import gCdSwitchJson from '../../songs/g-c-d-switch.json'
import openStringsJson from '../../songs/open-strings.json'
import twinkleSnippetJson from '../../songs/twinkle-snippet.json'
import { songFixtures } from '../../songs/index.ts'
import { parseSongDocument } from './schema.ts'
import type { SongDocument } from './types.ts'

function cloneValid(): SongDocument {
  return structuredClone(openStringsJson) as SongDocument
}

describe('parseSongDocument', () => {
  it('accepts every built-in song fixture', () => {
    expect(songFixtures.length).toBeGreaterThanOrEqual(5)
    for (const fixture of songFixtures) {
      const doc = parseSongDocument(fixture)
      expect(doc.formatVersion).toBe(1)
      expect(doc.id).toBeTruthy()
      expect(doc.measures.length).toBeGreaterThan(0)
    }
  })

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

  it('accepts eight-bar-drill fixture', () => {
    const doc = parseSongDocument(eightBarDrillJson)
    expect(doc.id).toBe('eight-bar-drill')
    expect(doc.formatVersion).toBe(1)
    expect(doc.measures).toHaveLength(8)
  })

  it('accepts twinkle-snippet fixture', () => {
    const doc = parseSongDocument(twinkleSnippetJson)
    expect(doc.id).toBe('twinkle-snippet')
    expect(doc.title).toBe('Twinkle Snippet')
    expect(doc.measures).toHaveLength(4)
  })

  it('accepts g-c-d-switch fixture', () => {
    const doc = parseSongDocument(gCdSwitchJson)
    expect(doc.id).toBe('g-c-d-switch')
    expect(doc.title).toBe('G–C–D Switch')
    expect(doc.measures).toHaveLength(4)
    expect(doc.measures.map((m) => m.chord)).toEqual(['G', 'C', 'D', 'G'])
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

import { afterEach, describe, expect, it, vi } from 'vitest'
import { songFixtures } from '../../songs/index.ts'
import openStringsJson from '../../songs/open-strings.json'
import { getSongById, listSongs } from './load.ts'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('listSongs', () => {
  it('returns id, title, bpm, and description for all built-in fixtures', () => {
    const list = listSongs()
    expect(list).toEqual([
      {
        id: 'open-strings',
        title: 'Open Strings',
        bpm: 80,
        description: 'Basic open string practice',
      },
      {
        id: 'c-am-switch',
        title: 'C–Am Switch',
        bpm: 70,
        description: 'Short C major / A minor chord-switch placeholder',
      },
      {
        id: 'eight-bar-drill',
        title: 'Eight-Bar Drill',
        bpm: 80,
        description: 'Longer open-string drill for horizontal score scrolling',
      },
      {
        id: 'twinkle-snippet',
        title: 'Twinkle Snippet',
        bpm: 90,
        description: 'Short open-position melody on the top strings',
      },
      {
        id: 'g-c-d-switch',
        title: 'G–C–D Switch',
        bpm: 72,
        description: 'Four-bar G / C / D chord rhythm with simple switches',
      },
    ])
    expect(list.length).toBeGreaterThanOrEqual(5)
    expect(list).toHaveLength(songFixtures.length)
  })

  it('covers open-string, melody, and chord practice by id', () => {
    const ids = new Set(listSongs().map((s) => s.id))
    // Open-string drill
    expect(ids.has('open-strings')).toBe(true)
    // Simple melody
    expect(ids.has('twinkle-snippet')).toBe(true)
    // Chord switch / rhythm
    expect(ids.has('c-am-switch')).toBe(true)
    expect(ids.has('g-c-d-switch')).toBe(true)
  })

  it('skips invalid entries with console.warn and does not crash', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const list = listSongs([
      openStringsJson,
      { id: 'broken', title: 'Broken', formatVersion: 99 },
      {
        formatVersion: 1,
        id: 'c-am-switch',
        title: 'C–Am Switch',
        tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
        bpm: 70,
        timeSignature: { numerator: 4, denominator: 4 },
        measures: [
          {
            index: 1,
            events: [
              { type: 'note', beat: 0, durationBeats: 1, string: 5, fret: 0 },
            ],
          },
        ],
      },
    ])

    expect(list).toEqual([
      {
        id: 'open-strings',
        title: 'Open Strings',
        bpm: 80,
        description: 'Basic open string practice',
      },
      {
        id: 'c-am-switch',
        title: 'C–Am Switch',
        bpm: 70,
      },
    ])
    expect(warn).toHaveBeenCalled()
    expect(warn.mock.calls.some((c) => String(c[0]).includes('Invalid SongDocument'))).toBe(
      true,
    )
  })

  it('omits description when the song JSON has none', () => {
    const list = listSongs([
      {
        formatVersion: 1,
        id: 'no-desc',
        title: 'No Description',
        tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
        bpm: 88,
        timeSignature: { numerator: 4, denominator: 4 },
        measures: [
          {
            index: 1,
            events: [
              { type: 'note', beat: 0, durationBeats: 1, string: 5, fret: 0 },
            ],
          },
        ],
      },
    ])
    expect(list).toEqual([{ id: 'no-desc', title: 'No Description', bpm: 88 }])
    expect(list[0]).not.toHaveProperty('description')
  })
})

describe('getSongById', () => {
  it('returns a SongDocument for a valid id', () => {
    const doc = getSongById('open-strings')
    expect(doc).not.toBeNull()
    expect(doc!.id).toBe('open-strings')
    expect(doc!.title).toBe('Open Strings')
    expect(doc!.formatVersion).toBe(1)
    expect(doc!.measures.length).toBeGreaterThan(0)
  })

  it('returns null for an unknown id', () => {
    expect(getSongById('does-not-exist')).toBeNull()
  })

  it('warns and returns null when the matching entry is invalid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const doc = getSongById('broken', [
      { id: 'broken', title: 'Broken', formatVersion: 99 },
    ])
    expect(doc).toBeNull()
    expect(warn).toHaveBeenCalled()
  })
})

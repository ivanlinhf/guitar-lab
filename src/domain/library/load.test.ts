import { afterEach, describe, expect, it, vi } from 'vitest'
import { songFixtures } from '../../songs/index.ts'
import openStringsJson from '../../songs/open-strings.json'
import { getSongById, listSongs } from './load.ts'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('listSongs', () => {
  it('returns id and title for all built-in fixtures', () => {
    const list = listSongs()
    expect(list).toEqual([
      { id: 'open-strings', title: 'Open Strings' },
      { id: 'c-am-switch', title: 'C–Am Switch' },
      { id: 'eight-bar-drill', title: 'Eight-Bar Drill' },
    ])
    expect(list).toHaveLength(songFixtures.length)
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
      { id: 'open-strings', title: 'Open Strings' },
      { id: 'c-am-switch', title: 'C–Am Switch' },
    ])
    expect(warn).toHaveBeenCalled()
    expect(warn.mock.calls.some((c) => String(c[0]).includes('Invalid SongDocument'))).toBe(
      true,
    )
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

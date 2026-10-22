import { describe, expect, it } from 'vitest'
import openStringsJson from '../../songs/open-strings.json'
import { notesAtPlayhead } from './notesAtPlayhead.ts'
import { parseSongDocument } from './schema.ts'
import type { SongDocument } from './types.ts'

const openStrings = parseSongDocument(openStringsJson)

/** Minimal song with a two-note chord, a rest, and a later single note. */
const chordSong: SongDocument = {
  formatVersion: 1,
  id: 'chord-fixture',
  title: 'Chord Fixture',
  tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
  bpm: 80,
  timeSignature: { numerator: 4, denominator: 4 },
  measures: [
    {
      index: 1,
      events: [
        { type: 'note', beat: 0, durationBeats: 1, string: 6, fret: 0 },
        { type: 'note', beat: 0, durationBeats: 1, string: 5, fret: 2 },
        { type: 'rest', beat: 1, durationBeats: 1 },
        { type: 'note', beat: 2, durationBeats: 2, string: 4, fret: 0 },
      ],
    },
  ],
}

describe('notesAtPlayhead', () => {
  it('returns the note covering the playhead', () => {
    const active = notesAtPlayhead(openStrings, 0.5)
    expect(active).toHaveLength(1)
    expect(active[0]).toMatchObject({
      absoluteBeat: 0,
      measureIndex: 1,
      note: { type: 'note', string: 6, fret: 0 },
    })
  })

  it('includes the note at its start beat (inclusive)', () => {
    const active = notesAtPlayhead(openStrings, 1)
    expect(active).toHaveLength(1)
    expect(active[0]!.note.string).toBe(5)
  })

  it('excludes the note at its end beat (exclusive)', () => {
    expect(notesAtPlayhead(openStrings, 1)).toHaveLength(1)
    // Beat 1 is the start of string 5, not still string 6
    expect(notesAtPlayhead(openStrings, 1)[0]!.note.string).toBe(5)
    expect(notesAtPlayhead(openStrings, 3)).toHaveLength(0)
  })

  it('does not highlight rests', () => {
    // Measure 1 beat 3 is a rest lasting 1 beat
    expect(notesAtPlayhead(openStrings, 3)).toEqual([])
    expect(notesAtPlayhead(openStrings, 3.5)).toEqual([])
  })

  it('returns all simultaneous notes at a chord', () => {
    const active = notesAtPlayhead(chordSong, 0.25)
    expect(active).toHaveLength(2)
    expect(active.map((a) => a.note.string).sort()).toEqual([5, 6])
    expect(active.every((a) => a.absoluteBeat === 0)).toBe(true)
  })

  it('returns nothing during a rest after a chord', () => {
    expect(notesAtPlayhead(chordSong, 1)).toEqual([])
    expect(notesAtPlayhead(chordSong, 1.9)).toEqual([])
  })

  it('covers a long note for its full duration', () => {
    const mid = notesAtPlayhead(chordSong, 3)
    expect(mid).toHaveLength(1)
    expect(mid[0]!.note.string).toBe(4)
    expect(notesAtPlayhead(chordSong, 4)).toEqual([])
  })
})

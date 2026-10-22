import { describe, expect, it } from 'vitest'
import openStringsJson from '../../songs/open-strings.json'
import {
  bigFretDisplay,
  nextNotesAfterPlayhead,
} from './bigFretDisplay.ts'
import { notesAtPlayhead } from './notesAtPlayhead.ts'
import { parseSongDocument } from './schema.ts'
import { songLengthBeats } from './time.ts'
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

describe('bigFretDisplay', () => {
  it('shows the sounding note as current and the following onset as next', () => {
    const display = bigFretDisplay(openStrings, 0.5)
    expect(display.current).toEqual([{ string: 6, fret: 0 }])
    expect(display.next).toEqual([{ string: 5, fret: 0 }])
  })

  it('matches notesAtPlayhead for current', () => {
    for (const beat of [0, 0.5, 1, 2.25, 3, 4, 5.5]) {
      const fromPlayhead = notesAtPlayhead(openStrings, beat).map((n) => ({
        string: n.note.string,
        fret: n.note.fret,
      }))
      const display = bigFretDisplay(openStrings, beat)
      expect(display.current).toEqual(
        [...fromPlayhead].sort((a, b) => b.string - a.string),
      )
    }
  })

  it('has empty current during a rest, with next pointing at the upcoming note', () => {
    // Measure 1 beat 3 is a rest; next note is measure 2 string 3.
    const display = bigFretDisplay(openStrings, 3.25)
    expect(display.current).toEqual([])
    expect(display.next).toEqual([{ string: 3, fret: 0 }])
  })

  it('has empty next at and past the end of the song', () => {
    const end = songLengthBeats(openStrings)
    expect(bigFretDisplay(openStrings, end - 0.01).next).toEqual([])
    expect(bigFretDisplay(openStrings, end).current).toEqual([])
    expect(bigFretDisplay(openStrings, end).next).toEqual([])
    expect(bigFretDisplay(openStrings, end + 1).current).toEqual([])
    expect(bigFretDisplay(openStrings, end + 1).next).toEqual([])
  })

  it('lists every string of a chord as current, then the next single note', () => {
    const display = bigFretDisplay(chordSong, 0.25)
    expect(display.current).toEqual([
      { string: 6, fret: 0 },
      { string: 5, fret: 2 },
    ])
    expect(display.next).toEqual([{ string: 4, fret: 0 }])
  })

  it('during a rest after a chord, next is the later note', () => {
    const display = bigFretDisplay(chordSong, 1.5)
    expect(display.current).toEqual([])
    expect(display.next).toEqual([{ string: 4, fret: 0 }])
  })

  it('on the last note, current is set and next is empty', () => {
    const display = bigFretDisplay(chordSong, 3)
    expect(display.current).toEqual([{ string: 4, fret: 0 }])
    expect(display.next).toEqual([])
  })
})

describe('nextNotesAfterPlayhead', () => {
  it('returns both notes of the next chord onset', () => {
    const onlyLaterChord: SongDocument = {
      ...chordSong,
      measures: [
        {
          index: 1,
          events: [
            { type: 'note', beat: 0, durationBeats: 1, string: 1, fret: 0 },
            { type: 'rest', beat: 1, durationBeats: 1 },
            { type: 'note', beat: 2, durationBeats: 1, string: 6, fret: 3 },
            { type: 'note', beat: 2, durationBeats: 1, string: 5, fret: 5 },
          ],
        },
      ],
    }
    const next = nextNotesAfterPlayhead(onlyLaterChord, 0.5)
    expect(next).toHaveLength(2)
    expect(next.map((n) => n.note.string).sort()).toEqual([5, 6])
    expect(next.every((n) => n.absoluteBeat === 2)).toBe(true)
  })

  it('skips rests when finding the next onset', () => {
    const next = nextNotesAfterPlayhead(openStrings, 2.5)
    expect(next).toHaveLength(1)
    expect(next[0]!.note.string).toBe(3)
    expect(next[0]!.absoluteBeat).toBe(4)
  })
})

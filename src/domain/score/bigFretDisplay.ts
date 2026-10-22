import { notesAtPlayhead, type NoteAtPlayhead } from './notesAtPlayhead.ts'
import { absoluteBeat } from './time.ts'
import type { GuitarString, SongDocument } from './types.ts'

/** One finger position for the large novice display. */
export type BigFretFinger = {
  string: GuitarString
  fret: number
}

/**
 * Current sounding notes (via {@link notesAtPlayhead}) plus the next onset
 * after the playhead — the earliest absoluteBeat strictly greater than
 * `playheadBeat`, including all simultaneous notes at that beat.
 */
export type BigFretDisplay = {
  current: BigFretFinger[]
  next: BigFretFinger[]
}

function toFingers(notes: NoteAtPlayhead[]): BigFretFinger[] {
  return notes
    .map((n) => ({ string: n.note.string, fret: n.note.fret }))
    .sort((a, b) => b.string - a.string)
}

/**
 * Notes that begin at the earliest absolute beat strictly after `playheadBeat`.
 * Empty when the song has no later note (rest at end, or past the last note).
 */
export function nextNotesAfterPlayhead(
  song: SongDocument,
  playheadBeat: number,
): NoteAtPlayhead[] {
  let earliest: number | null = null
  const atEarliest: NoteAtPlayhead[] = []

  for (const measure of song.measures) {
    for (const event of measure.events) {
      if (event.type !== 'note') continue
      const start = absoluteBeat(song, measure.index, event.beat)
      if (start <= playheadBeat) continue
      if (earliest === null || start < earliest) {
        earliest = start
        atEarliest.length = 0
        atEarliest.push({
          absoluteBeat: start,
          measureIndex: measure.index,
          note: event,
        })
      } else if (start === earliest) {
        atEarliest.push({
          absoluteBeat: start,
          measureIndex: measure.index,
          note: event,
        })
      }
    }
  }

  return atEarliest
}

/** Derive large-fret panel data from the playhead. */
export function bigFretDisplay(
  song: SongDocument,
  playheadBeat: number,
): BigFretDisplay {
  return {
    current: toFingers(notesAtPlayhead(song, playheadBeat)),
    next: toFingers(nextNotesAfterPlayhead(song, playheadBeat)),
  }
}

import { absoluteBeat } from './time.ts'
import type { NoteEvent, SongDocument } from './types.ts'

/** A sounding note under the playhead, with its absolute start beat. */
export type NoteAtPlayhead = {
  absoluteBeat: number
  measureIndex: number
  note: NoteEvent
}

/**
 * Notes sounding at `playheadBeat`: absoluteBeat ≤ playhead < absoluteBeat + duration.
 * Rests are never included. Simultaneous notes are all returned.
 */
export function notesAtPlayhead(
  song: SongDocument,
  playheadBeat: number,
): NoteAtPlayhead[] {
  const active: NoteAtPlayhead[] = []
  for (const measure of song.measures) {
    for (const event of measure.events) {
      if (event.type !== 'note') continue
      const start = absoluteBeat(song, measure.index, event.beat)
      const end = start + event.durationBeats
      if (start <= playheadBeat && playheadBeat < end) {
        active.push({
          absoluteBeat: start,
          measureIndex: measure.index,
          note: event,
        })
      }
    }
  }
  return active
}

import { playGuitarNote } from '../../audio/index.ts'
import type { ScheduledEvent } from '../../domain/player/index.ts'
import { beatToSeconds } from '../../domain/score/index.ts'

/**
 * Sound a scheduled note via the guitar tone helper.
 * Rests are ignored (no audio).
 */
export function soundScheduledNote(
  scheduled: ScheduledEvent,
  bpm: number,
  tempoRatio: number,
): void {
  const { event } = scheduled
  if (event.type !== 'note') {
    return
  }
  const durationSec = beatToSeconds(event.durationBeats, bpm, tempoRatio)
  void playGuitarNote({
    string: event.string,
    fret: event.fret,
    durationSec,
  })
}

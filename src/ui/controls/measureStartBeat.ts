import { lastMeasureIndex } from '../../domain/player/index.ts'
import { absoluteBeat } from '../../domain/score/index.ts'
import type { SongDocument } from '../../domain/score/types.ts'

/**
 * Absolute beat at the start of a 1-based measure (beat 0 in that measure).
 * Clamps `measureIndex` to `[1, lastMeasure]`.
 */
export function measureStartBeat(
  song: SongDocument,
  measureIndex: number,
): number {
  const last = lastMeasureIndex(song)
  const clamped = Math.min(Math.max(1, Math.trunc(measureIndex)), last)
  return absoluteBeat(song, clamped, 0)
}

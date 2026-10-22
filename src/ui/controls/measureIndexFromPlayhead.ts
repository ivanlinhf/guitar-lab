import { lastMeasureIndex } from '../../domain/player/index.ts'
import { beatsPerMeasure } from '../../domain/score/index.ts'
import type { SongDocument } from '../../domain/score/types.ts'

/**
 * 1-based measure index containing `playheadBeat`, matching domain beat math.
 * Clamped to `[1, lastMeasure]`.
 */
export function measureIndexFromPlayhead(
  song: SongDocument,
  playheadBeat: number,
): number {
  const bpm = beatsPerMeasure(song)
  const last = lastMeasureIndex(song)
  if (bpm <= 0) {
    return 1
  }
  const raw = Math.floor(playheadBeat / bpm) + 1
  return Math.min(Math.max(1, raw), last)
}

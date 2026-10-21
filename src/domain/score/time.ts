import type { SongDocument } from './types.ts'

/** Beats in one measure (denominator 4: numerator is beats per measure). */
export function beatsPerMeasure(song: SongDocument): number {
  return song.timeSignature.numerator
}

/** Total length of the song in absolute beats. */
export function songLengthBeats(song: SongDocument): number {
  return song.measures.length * beatsPerMeasure(song)
}

/**
 * Absolute beat from song start.
 * `measureIndex` is 1-based (matches measure.index); `beatInMeasure` is 0-based within the measure.
 */
export function absoluteBeat(
  song: SongDocument,
  measureIndex: number,
  beatInMeasure: number,
): number {
  return (measureIndex - 1) * beatsPerMeasure(song) + beatInMeasure
}

/** Effective BPM after applying the practice tempo ratio. */
export function effectiveBpm(bpm: number, tempoRatio: number): number {
  return bpm * tempoRatio
}

/** Convert an absolute beat position to seconds at the given BPM and tempo ratio. */
export function beatToSeconds(
  absBeat: number,
  bpm: number,
  tempoRatio: number,
): number {
  return absBeat * (60 / effectiveBpm(bpm, tempoRatio))
}

/** Inverse of {@link beatToSeconds}. */
export function secondsToBeat(
  seconds: number,
  bpm: number,
  tempoRatio: number,
): number {
  return seconds * (effectiveBpm(bpm, tempoRatio) / 60)
}

/** Skip settle when playhead jumped farther than this (scrub / seek). */
export const FRET_SETTLE_MAX_BEAT_DELTA = 1.5

/**
 * Whether active-fret / playhead settle should run for a note change.
 * First paint and far seeks snap with no motion.
 */
export function shouldAnimateFretSettle(
  previousBeat: number | undefined,
  nextBeat: number,
  maxDelta: number = FRET_SETTLE_MAX_BEAT_DELTA,
): boolean {
  if (previousBeat === undefined) {
    return false
  }
  return Math.abs(nextBeat - previousBeat) <= maxDelta
}

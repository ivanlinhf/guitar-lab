import {
  TEMPO_RATIO_MAX,
  TEMPO_RATIO_MIN,
  clampTempoRatio,
} from '../../domain/player/index.ts'

/** Inclusive UI percent bounds matching practice tempo ratio. */
export const TEMPO_PERCENT_MIN = Math.round(TEMPO_RATIO_MIN * 100)
export const TEMPO_PERCENT_MAX = Math.round(TEMPO_RATIO_MAX * 100)

/** Convert a practice tempo ratio to a whole-number percent for the slider. */
export function tempoRatioToPercent(tempoRatio: number): number {
  const clamped = clampTempoRatio(tempoRatio)
  return Math.round(clamped * 100)
}

/** Convert a slider percent to a practice tempo ratio, clamped to 50%–100%. */
export function percentToTempoRatio(percent: number): number {
  const clampedPercent = Math.min(
    TEMPO_PERCENT_MAX,
    Math.max(TEMPO_PERCENT_MIN, percent),
  )
  return clampTempoRatio(clampedPercent / 100)
}

import { describe, expect, it } from 'vitest'
import {
  TEMPO_PERCENT_MAX,
  TEMPO_PERCENT_MIN,
  percentToTempoRatio,
  tempoRatioToPercent,
} from './tempoPercent.ts'

describe('tempoRatioToPercent', () => {
  it('maps ratio bounds to 50%–100%', () => {
    expect(tempoRatioToPercent(0.5)).toBe(TEMPO_PERCENT_MIN)
    expect(tempoRatioToPercent(1)).toBe(TEMPO_PERCENT_MAX)
  })

  it('clamps out-of-range ratios before converting', () => {
    expect(tempoRatioToPercent(0.25)).toBe(TEMPO_PERCENT_MIN)
    expect(tempoRatioToPercent(1.5)).toBe(TEMPO_PERCENT_MAX)
  })
})

describe('percentToTempoRatio', () => {
  it('maps percent bounds to 0.5–1', () => {
    expect(percentToTempoRatio(50)).toBe(0.5)
    expect(percentToTempoRatio(100)).toBe(1)
  })

  it('clamps out-of-range percents before converting', () => {
    expect(percentToTempoRatio(10)).toBe(0.5)
    expect(percentToTempoRatio(150)).toBe(1)
  })
})

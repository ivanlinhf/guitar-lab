import { describe, expect, it } from 'vitest'
import {
  FRET_SETTLE_MAX_BEAT_DELTA,
  shouldAnimateFretSettle,
} from './shouldAnimateFretSettle.ts'

describe('shouldAnimateFretSettle', () => {
  it('snaps on first paint (no previous beat)', () => {
    expect(shouldAnimateFretSettle(undefined, 0)).toBe(false)
  })

  it('settles for small playhead steps', () => {
    expect(shouldAnimateFretSettle(0, 0.5)).toBe(true)
    expect(shouldAnimateFretSettle(2, 2 + FRET_SETTLE_MAX_BEAT_DELTA)).toBe(
      true,
    )
  })

  it('snaps when seek jumps farther than the delta cap', () => {
    expect(
      shouldAnimateFretSettle(0, FRET_SETTLE_MAX_BEAT_DELTA + 0.01),
    ).toBe(false)
    expect(shouldAnimateFretSettle(1, 8)).toBe(false)
  })
})

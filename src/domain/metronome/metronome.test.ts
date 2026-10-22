import { describe, expect, it, vi } from 'vitest'
import {
  advanceMetronomeBefore,
  advanceMetronomeTo,
  createMetronome,
  isIntegerBeat,
  nextIntegerBeatAtOrAfter,
  onMetronomeClick,
  setMetronomeEnabled,
  syncMetronomePlayhead,
} from './metronome.ts'

describe('nextIntegerBeatAtOrAfter', () => {
  it('keeps exact integers', () => {
    expect(nextIntegerBeatAtOrAfter(0)).toBe(0)
    expect(nextIntegerBeatAtOrAfter(3)).toBe(3)
  })

  it('ceils fractional beats', () => {
    expect(nextIntegerBeatAtOrAfter(0.1)).toBe(1)
    expect(nextIntegerBeatAtOrAfter(2.9)).toBe(3)
  })

  it('treats near-integers as integers', () => {
    expect(isIntegerBeat(1 + 1e-12)).toBe(true)
    expect(nextIntegerBeatAtOrAfter(1 + 1e-12)).toBe(1)
  })
})

describe('advanceMetronomeTo', () => {
  it('does nothing when disabled', () => {
    const m = createMetronome(0)
    const clicks: number[] = []
    onMetronomeClick(m, (b) => clicks.push(b))
    advanceMetronomeTo(m, 4)
    expect(clicks).toEqual([])
    expect(m.nextBeat).toBe(0)
  })

  it('fires integer beats inclusive of toBeat', () => {
    const m = createMetronome(0)
    setMetronomeEnabled(m, true, 0)
    const clicks: number[] = []
    onMetronomeClick(m, (b) => clicks.push(b))
    advanceMetronomeTo(m, 2.5)
    expect(clicks).toEqual([0, 1, 2])
    expect(m.nextBeat).toBe(3)
  })

  it('does not re-fire after a partial advance', () => {
    const m = createMetronome(0)
    setMetronomeEnabled(m, true, 0)
    const clicks: number[] = []
    onMetronomeClick(m, (b) => clicks.push(b))
    advanceMetronomeTo(m, 1.2)
    advanceMetronomeTo(m, 1.8)
    advanceMetronomeTo(m, 3.0)
    expect(clicks).toEqual([0, 1, 2, 3])
  })
})

describe('syncMetronomePlayhead', () => {
  it('after seek to an integer, fires that beat once on the next advance (no double)', () => {
    const m = createMetronome(0)
    setMetronomeEnabled(m, true, 0)
    const clicks: number[] = []
    onMetronomeClick(m, (b) => clicks.push(b))
    advanceMetronomeTo(m, 2.5)
    expect(clicks).toEqual([0, 1, 2])

    // Seek alone does not click; the following advance fires beat 1 once.
    syncMetronomePlayhead(m, 1.0)
    expect(clicks).toEqual([0, 1, 2])
    advanceMetronomeTo(m, 1.1)
    expect(clicks).toEqual([0, 1, 2, 1])

    advanceMetronomeTo(m, 2.1)
    expect(clicks).toEqual([0, 1, 2, 1, 2])
  })

  it('does not miss the next beat after a mid-beat seek', () => {
    const m = createMetronome(0)
    setMetronomeEnabled(m, true, 0)
    const clicks: number[] = []
    onMetronomeClick(m, (b) => clicks.push(b))
    advanceMetronomeTo(m, 4)

    syncMetronomePlayhead(m, 1.5)
    advanceMetronomeTo(m, 2.0)
    expect(clicks.at(-1)).toBe(2)
    expect(clicks.filter((b) => b === 2).length).toBe(2)
  })
})

describe('setMetronomeEnabled', () => {
  it('syncs on enable so beats while disabled are not dumped', () => {
    const m = createMetronome(0)
    const clicks: number[] = []
    onMetronomeClick(m, (b) => clicks.push(b))
    // Disabled while playhead advances conceptually past beats 0–4:
    syncMetronomePlayhead(m, 5)
    setMetronomeEnabled(m, true, 5)
    // Next advance past 5 fires 5 once — not 0..4.
    advanceMetronomeTo(m, 5.5)
    expect(clicks).toEqual([5])
    advanceMetronomeTo(m, 6.0)
    expect(clicks).toEqual([5, 6])
  })
})

describe('advanceMetronomeBefore', () => {
  it('stops short of the exclusive boundary', () => {
    const m = createMetronome(0)
    setMetronomeEnabled(m, true, 0)
    const clicks: number[] = []
    onMetronomeClick(m, (b) => clicks.push(b))
    advanceMetronomeBefore(m, 4)
    expect(clicks).toEqual([0, 1, 2, 3])
    expect(m.nextBeat).toBe(4)
  })
})

describe('onMetronomeClick', () => {
  it('unsubscribes', () => {
    const m = createMetronome(0)
    setMetronomeEnabled(m, true, 0)
    const listener = vi.fn()
    const unsubscribe = onMetronomeClick(m, listener)
    unsubscribe()
    advanceMetronomeTo(m, 1)
    expect(listener).not.toHaveBeenCalled()
  })
})

import { describe, expect, it, vi } from 'vitest'
import openStringsJson from '../../songs/open-strings.json'
import { parseSongDocument } from '../score/schema.ts'
import { beatToSeconds, songLengthBeats } from '../score/time.ts'
import {
  createPlayer,
  isMetronomeEnabled,
  measureEndBeat,
  onMetronome,
  play,
  setLoopA,
  setLoopB,
  setLoopEnabled,
  setMetronomeEnabled,
  setPlayhead,
  setTempoRatio,
  tick,
} from './player.ts'

const song = parseSongDocument(openStringsJson)

/** Seconds for `beats` at song BPM and the given tempo ratio. */
function secondsForBeats(beats: number, tempoRatio = 1): number {
  return beatToSeconds(beats, song.bpm, tempoRatio)
}

describe('player metronome', () => {
  it('starts disabled', () => {
    const player = createPlayer(song)
    expect(isMetronomeEnabled(player)).toBe(false)
  })

  it('schedules clicks on integer beat boundaries as the playhead advances', () => {
    const player = createPlayer(song)
    setMetronomeEnabled(player, true)
    play(player)
    const clicks: number[] = []
    onMetronome(player, (b) => clicks.push(b))

    tick(player, secondsForBeats(2.5))
    expect(clicks).toEqual([0, 1, 2])
  })

  it('respects tempoRatio when scheduling via wall-clock deltas', () => {
    const player = createPlayer(song)
    setTempoRatio(player, 0.5)
    setMetronomeEnabled(player, true)
    play(player)
    const clicks: number[] = []
    onMetronome(player, (b) => clicks.push(b))

    // Wall seconds for 2 beats at ratio 1 cover only 1 beat at ratio 0.5.
    tick(player, secondsForBeats(2, 1))
    expect(player.playheadBeat).toBeCloseTo(1, 10)
    expect(clicks).toEqual([0, 1])

    tick(player, secondsForBeats(2, 1))
    expect(player.playheadBeat).toBeCloseTo(2, 10)
    expect(clicks).toEqual([0, 1, 2])

    // Same wall delta at ratio 1 would have covered 4 beats (0..4).
    const atFullSpeed = createPlayer(song)
    setMetronomeEnabled(atFullSpeed, true)
    play(atFullSpeed)
    const fullClicks: number[] = []
    onMetronome(atFullSpeed, (b) => fullClicks.push(b))
    tick(atFullSpeed, secondsForBeats(2, 1) * 2)
    expect(fullClicks).toEqual([0, 1, 2, 3, 4])
  })

  it('does not schedule when disabled', () => {
    const player = createPlayer(song)
    play(player)
    const listener = vi.fn()
    onMetronome(player, listener)
    tick(player, secondsForBeats(4))
    expect(listener).not.toHaveBeenCalled()
  })

  it('after setPlayhead, does not double or miss beats', () => {
    const player = createPlayer(song)
    setMetronomeEnabled(player, true)
    play(player)
    const clicks: number[] = []
    onMetronome(player, (b) => clicks.push(b))

    tick(player, secondsForBeats(3.2))
    expect(clicks).toEqual([0, 1, 2, 3])

    setPlayhead(player, 1.0)
    tick(player, secondsForBeats(0.01))
    // Sitting on beat 1: first tiny advance fires 1 once (not a double of the prior 1).
    expect(clicks.filter((b) => b === 1)).toEqual([1, 1])
    expect(clicks.at(-1)).toBe(1)

    tick(player, secondsForBeats(1.1))
    expect(clicks.at(-1)).toBe(2)
    // Beat 2 fired once after seek (plus the earlier pre-seek 2).
    expect(clicks.filter((b) => b === 2)).toEqual([2, 2])
  })

  it('after mid-beat seek, next integer is not missed', () => {
    const player = createPlayer(song)
    setMetronomeEnabled(player, true)
    play(player)
    const clicks: number[] = []
    onMetronome(player, (b) => clicks.push(b))

    tick(player, secondsForBeats(0.5))
    expect(clicks).toEqual([0])

    setPlayhead(player, 2.25)
    tick(player, secondsForBeats(0.8))
    expect(clicks).toEqual([0, 3])
  })

  it('stops scheduling when paused (tick is a no-op)', () => {
    const player = createPlayer(song)
    setMetronomeEnabled(player, true)
    play(player)
    const clicks: number[] = []
    onMetronome(player, (b) => clicks.push(b))
    tick(player, secondsForBeats(1.5))
    expect(clicks).toEqual([0, 1])

    player.isPlaying = false
    tick(player, secondsForBeats(2))
    expect(clicks).toEqual([0, 1])
  })

  it('does not dump clicks when re-enabled after the playhead moved', () => {
    const player = createPlayer(song)
    play(player)
    const clicks: number[] = []
    onMetronome(player, (b) => clicks.push(b))

    tick(player, secondsForBeats(3))
    expect(clicks).toEqual([])
    expect(player.playheadBeat).toBeCloseTo(3, 10)

    setMetronomeEnabled(player, true)
    tick(player, secondsForBeats(0.5))
    // Fires current integer (3), not the skipped 0–2.
    expect(clicks).toEqual([3])
    tick(player, secondsForBeats(0.6))
    expect(clicks).toEqual([3, 4])
  })

  it('clamps with song end without repeating the final beat', () => {
    const player = createPlayer(song)
    setMetronomeEnabled(player, true)
    play(player)
    const clicks: number[] = []
    onMetronome(player, (b) => clicks.push(b))

    const end = songLengthBeats(song)
    tick(player, secondsForBeats(end + 2))
    expect(player.playheadBeat).toBe(end)
    // open-strings is 8 beats (0..8]; integer clicks 0..8 inclusive when landing on end.
    expect(clicks).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])

    tick(player, secondsForBeats(1))
    expect(clicks).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('on A–B wrap, does not click the exclusive end beat then re-clicks loop start', () => {
    const player = createPlayer(song)
    setLoopA(player, 1)
    setLoopB(player, 1)
    setLoopEnabled(player, true)
    setMetronomeEnabled(player, true)
    play(player)
    const clicks: number[] = []
    onMetronome(player, (b) => clicks.push(b))

    const endB = measureEndBeat(song, 1) // 4
    setPlayhead(player, endB - 0.5)
    tick(player, secondsForBeats(0.7))
    // Crosses 4 → wraps to ~0.2; exclusive end skips beat 4; lands past 0 so no 0 click.
    expect(clicks.includes(4)).toBe(false)
    expect(player.playheadBeat).toBeCloseTo(0.2, 10)

    tick(player, secondsForBeats(0.9))
    expect(clicks).toContain(1)
  })
})

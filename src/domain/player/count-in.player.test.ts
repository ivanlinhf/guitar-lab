import { describe, expect, it, vi } from 'vitest'
import openStringsJson from '../../songs/open-strings.json'
import { parseSongDocument } from '../score/schema.ts'
import {
  absoluteBeat,
  beatToSeconds,
  beatsPerMeasure,
} from '../score/time.ts'
import {
  createPlayer,
  getPlayhead,
  isCountInEnabled,
  isCountingIn,
  measureEndBeat,
  onMetronome,
  onSchedule,
  pause,
  play,
  setCountInEnabled,
  setLoopA,
  setLoopB,
  setLoopEnabled,
  setMetronomeEnabled,
  setPlayhead,
  setTempoRatio,
  tick,
} from './player.ts'
import type { ScheduledEvent } from './player.ts'

const song = parseSongDocument(openStringsJson)
const numerator = beatsPerMeasure(song)

/** Seconds for `beats` at song BPM and the given tempo ratio. */
function secondsForBeats(beats: number, tempoRatio = 1): number {
  return beatToSeconds(beats, song.bpm, tempoRatio)
}

describe('count-in', () => {
  it('defaults to disabled', () => {
    const player = createPlayer(song)
    expect(isCountInEnabled(player)).toBe(false)
    expect(isCountingIn(player)).toBe(false)
  })

  it('setCountInEnabled toggles the flag without starting count-in', () => {
    const player = createPlayer(song)
    setCountInEnabled(player, true)
    expect(isCountInEnabled(player)).toBe(true)
    expect(isCountingIn(player)).toBe(false)
    setCountInEnabled(player, false)
    expect(isCountInEnabled(player)).toBe(false)
  })

  it('on play with count-in enabled, runs full numerator beats before guitar', () => {
    const player = createPlayer(song)
    setCountInEnabled(player, true)
    const fired: ScheduledEvent[] = []
    onSchedule(player, (e) => {
      fired.push(e)
    })
    play(player)
    expect(isCountingIn(player)).toBe(true)
    expect(player.countInRemainingBeats).toBe(numerator)

    // Almost a full measure: still counting in; no guitar.
    tick(player, secondsForBeats(numerator - 0.25))
    expect(isCountingIn(player)).toBe(true)
    expect(getPlayhead(player)).toBe(0)
    expect(fired).toEqual([])

    // Finish count-in with a little overflow into the song.
    tick(player, secondsForBeats(0.5))
    expect(isCountingIn(player)).toBe(false)
    expect(getPlayhead(player)).toBeCloseTo(0.25, 10)
    expect(fired.map((e) => e.absoluteBeat)).toEqual([0])
  })

  it('fires count-in clicks even when metronome is disabled', () => {
    const player = createPlayer(song)
    setCountInEnabled(player, true)
    play(player)
    const clicks: number[] = []
    onMetronome(player, (b) => {
      clicks.push(b)
    })

    tick(player, secondsForBeats(numerator))
    expect(clicks).toEqual([0, 1, 2, 3])
    expect(isCountingIn(player)).toBe(false)
    expect(getPlayhead(player)).toBeCloseTo(0, 10)
  })

  it('does not schedule guitar during count-in; schedules after', () => {
    const player = createPlayer(song)
    setCountInEnabled(player, true)
    const listener = vi.fn()
    onSchedule(player, listener)
    play(player)

    tick(player, secondsForBeats(2))
    expect(listener).not.toHaveBeenCalled()
    expect(getPlayhead(player)).toBe(0)

    tick(player, secondsForBeats(numerator))
    expect(getPlayhead(player)).toBeCloseTo(2, 10)
    expect(listener).toHaveBeenCalled()
    const beats = listener.mock.calls.map((call) => {
      const scheduled = call[0] as ScheduledEvent
      return scheduled.absoluteBeat
    })
    expect(beats).toEqual([0, 1, 2])
  })

  it('respects tempoRatio for count-in wall-clock duration', () => {
    const player = createPlayer(song)
    setTempoRatio(player, 0.5)
    setCountInEnabled(player, true)
    const fired: number[] = []
    onSchedule(player, (e) => {
      fired.push(e.absoluteBeat)
    })
    play(player)

    // Wall seconds for 4 beats at ratio 1 cover only 2 beats at ratio 0.5.
    tick(player, secondsForBeats(numerator, 1))
    expect(isCountingIn(player)).toBe(true)
    expect(player.countInRemainingBeats).toBeCloseTo(2, 10)
    expect(fired).toEqual([])

    tick(player, secondsForBeats(numerator, 1))
    expect(isCountingIn(player)).toBe(false)
    expect(getPlayhead(player)).toBeCloseTo(0, 10)
  })

  it('A–B wrap does not re-enter count-in', () => {
    const player = createPlayer(song)
    setCountInEnabled(player, true)
    setLoopA(player, 1)
    setLoopB(player, 1)
    setLoopEnabled(player, true)
    const fired: number[] = []
    onSchedule(player, (e) => {
      fired.push(e.absoluteBeat)
    })

    play(player)
    // Skip through count-in.
    tick(player, secondsForBeats(numerator))
    expect(isCountingIn(player)).toBe(false)

    // Play near end of B and wrap onto beat 0 of A (no second count-in).
    setPlayhead(player, measureEndBeat(song, 1) - 0.5)
    tick(player, secondsForBeats(0.5))
    expect(isCountingIn(player)).toBe(false)
    expect(getPlayhead(player)).toBeCloseTo(absoluteBeat(song, 1, 0), 10)
    // Guitar at loop start fires on wrap — no count-in gap.
    expect(fired).toContain(0)
  })

  it('mid-song seek then play runs a fresh count-in before guitar', () => {
    const player = createPlayer(song)
    setCountInEnabled(player, true)
    const fired: number[] = []
    onSchedule(player, (e) => {
      fired.push(e.absoluteBeat)
    })

    setPlayhead(player, 4.25)
    play(player)
    expect(isCountingIn(player)).toBe(true)
    expect(getPlayhead(player)).toBe(4.25)

    tick(player, secondsForBeats(numerator - 0.1))
    expect(fired).toEqual([])
    expect(getPlayhead(player)).toBe(4.25)

    // Finish count-in (+0.1 into the song) — still before the note at 4.5.
    tick(player, secondsForBeats(0.2))
    expect(isCountingIn(player)).toBe(false)
    expect(getPlayhead(player)).toBeCloseTo(4.35, 10)
    expect(fired).toEqual([])

    tick(player, secondsForBeats(0.2))
    expect(getPlayhead(player)).toBeCloseTo(4.55, 10)
    expect(fired).toEqual([4.5])
  })

  it('pause mid-count-in clears it; next play restarts a full count-in', () => {
    const player = createPlayer(song)
    setCountInEnabled(player, true)
    play(player)
    tick(player, secondsForBeats(1.5))
    expect(isCountingIn(player)).toBe(true)
    expect(player.countInRemainingBeats).toBeCloseTo(numerator - 1.5, 10)

    pause(player)
    expect(isCountingIn(player)).toBe(false)
    expect(player.countInRemainingBeats).toBe(0)

    const fired: number[] = []
    onSchedule(player, (e) => {
      fired.push(e.absoluteBeat)
    })
    play(player)
    expect(player.countInRemainingBeats).toBe(numerator)
    tick(player, secondsForBeats(numerator - 0.5))
    expect(fired).toEqual([])
    tick(player, secondsForBeats(1))
    expect(fired[0]).toBe(0)
  })

  it('when count-in is disabled, play schedules guitar immediately', () => {
    const player = createPlayer(song)
    setCountInEnabled(player, false)
    const fired: number[] = []
    onSchedule(player, (e) => {
      fired.push(e.absoluteBeat)
    })
    play(player)
    expect(isCountingIn(player)).toBe(false)
    tick(player, secondsForBeats(0.5))
    expect(fired).toEqual([0])
  })

  it('after count-in, metronome (when enabled) continues from the song playhead', () => {
    const player = createPlayer(song)
    setCountInEnabled(player, true)
    setMetronomeEnabled(player, true)
    const clicks: number[] = []
    onMetronome(player, (b) => {
      clicks.push(b)
    })
    play(player)

    // Count-in clicks 0..3, then song advances 1.5 beats → metronome 0,1.
    tick(player, secondsForBeats(numerator + 1.5))
    expect(clicks).toEqual([0, 1, 2, 3, 0, 1])
    expect(getPlayhead(player)).toBeCloseTo(1.5, 10)
  })
})

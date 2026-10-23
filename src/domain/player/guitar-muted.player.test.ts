import { describe, expect, it, vi } from 'vitest'
import openStringsJson from '../../songs/open-strings.json'
import { parseSongDocument } from '../score/schema.ts'
import { beatToSeconds, beatsPerMeasure } from '../score/time.ts'
import {
  createPlayer,
  getPlayhead,
  isCountingIn,
  isGuitarMuted,
  onMetronome,
  onSchedule,
  play,
  setCountInEnabled,
  setGuitarMuted,
  setMetronomeEnabled,
  setPlayhead,
  tick,
} from './player.ts'
import type { ScheduledEvent } from './player.ts'

const song = parseSongDocument(openStringsJson)
const numerator = beatsPerMeasure(song)

/** Seconds for `beats` at song BPM and tempo ratio 1. */
function secondsForBeats(beats: number): number {
  return beatToSeconds(beats, song.bpm, 1)
}

describe('player guitarMuted', () => {
  it('starts unmuted', () => {
    const player = createPlayer(song)
    expect(isGuitarMuted(player)).toBe(false)
    expect(player.guitarMuted).toBe(false)
  })

  it('when muted, onSchedule does not fire while the playhead advances', () => {
    const player = createPlayer(song)
    setGuitarMuted(player, true)
    play(player)
    const listener = vi.fn()
    onSchedule(player, listener)

    tick(player, secondsForBeats(4))
    expect(player.playheadBeat).toBeCloseTo(4, 10)
    expect(listener).not.toHaveBeenCalled()
  })

  it('unmute restores guitar schedule for subsequent events only', () => {
    const player = createPlayer(song)
    setGuitarMuted(player, true)
    play(player)
    const fired: ScheduledEvent[] = []
    onSchedule(player, (e) => {
      fired.push(e)
    })

    tick(player, secondsForBeats(3.5))
    expect(fired).toEqual([])
    expect(player.nextScheduleIndex).toBeGreaterThan(0)

    setGuitarMuted(player, false)
    tick(player, secondsForBeats(4.5))
    // Events already crossed while muted must not dump; only later ones fire.
    expect(fired.every((e) => e.absoluteBeat > 3.5)).toBe(true)
    expect(fired.map((e) => e.absoluteBeat)).toEqual([4, 4.5, 5, 6])
  })

  it('muted + metronome on: clicks fire, guitar schedule does not', () => {
    const player = createPlayer(song)
    setGuitarMuted(player, true)
    setMetronomeEnabled(player, true)
    play(player)
    const schedule = vi.fn()
    const clicks: number[] = []
    onSchedule(player, schedule)
    onMetronome(player, (b) => clicks.push(b))

    tick(player, secondsForBeats(2.5))
    expect(schedule).not.toHaveBeenCalled()
    expect(clicks).toEqual([0, 1, 2])
  })

  it('muted + metronome off: silent score-follow (no guitar, no clicks)', () => {
    const player = createPlayer(song)
    setGuitarMuted(player, true)
    play(player)
    const schedule = vi.fn()
    const click = vi.fn()
    onSchedule(player, schedule)
    onMetronome(player, click)

    tick(player, secondsForBeats(4))
    expect(player.playheadBeat).toBeCloseTo(4, 10)
    expect(schedule).not.toHaveBeenCalled()
    expect(click).not.toHaveBeenCalled()
  })

  it('unmuted + metronome on: both guitar schedule and clicks fire', () => {
    const player = createPlayer(song)
    setMetronomeEnabled(player, true)
    play(player)
    const fired: number[] = []
    const clicks: number[] = []
    onSchedule(player, (e) => {
      fired.push(e.absoluteBeat)
    })
    onMetronome(player, (b) => clicks.push(b))

    tick(player, secondsForBeats(2.5))
    expect(fired).toEqual([0, 1, 2])
    expect(clicks).toEqual([0, 1, 2])
  })

  it('toggling mute mid-playback does not re-fire past events after seek', () => {
    const player = createPlayer(song)
    play(player)
    const fired: number[] = []
    onSchedule(player, (e) => {
      fired.push(e.absoluteBeat)
    })

    tick(player, secondsForBeats(2))
    expect(fired).toEqual([0, 1, 2])

    setGuitarMuted(player, true)
    tick(player, secondsForBeats(2))
    expect(fired).toEqual([0, 1, 2])

    setPlayhead(player, 1)
    setGuitarMuted(player, false)
    tick(player, secondsForBeats(0.01))
    // Seek reset the cursor; events at/after 1 may fire again — not a mute dump.
    expect(fired.filter((b) => b < 1)).toEqual([0])
  })
})

describe('count-in × guitarMuted', () => {
  it('during and after count-in while muted: clicks fire, onSchedule stays quiet', () => {
    const player = createPlayer(song)
    setCountInEnabled(player, true)
    setGuitarMuted(player, true)
    setMetronomeEnabled(player, true)
    const schedule = vi.fn()
    const clicks: number[] = []
    onSchedule(player, schedule)
    onMetronome(player, (b) => clicks.push(b))
    play(player)

    // Mid count-in: clicks only; playhead frozen; no guitar.
    // Elapsed 1.5 → clicks at integer beats 0 and 1 (beat 2 not yet reached).
    tick(player, secondsForBeats(1.5))
    expect(isCountingIn(player)).toBe(true)
    expect(getPlayhead(player)).toBe(0)
    expect(clicks).toEqual([0, 1])
    expect(schedule).not.toHaveBeenCalled()

    // Finish count-in and advance into the song while still muted.
    tick(player, secondsForBeats(numerator))
    expect(isCountingIn(player)).toBe(false)
    expect(getPlayhead(player)).toBeCloseTo(1.5, 10)
    // Count-in 0..3, then song metronome 0,1.
    expect(clicks).toEqual([0, 1, 2, 3, 0, 1])
    expect(schedule).not.toHaveBeenCalled()
  })

  it('unmute after count-in: onSchedule fires only for subsequent events', () => {
    const player = createPlayer(song)
    setCountInEnabled(player, true)
    setGuitarMuted(player, true)
    const fired: number[] = []
    onSchedule(player, (e) => {
      fired.push(e.absoluteBeat)
    })
    play(player)

    // Through count-in + 1.5 song beats while muted — schedule quiet.
    tick(player, secondsForBeats(numerator + 1.5))
    expect(isCountingIn(player)).toBe(false)
    expect(getPlayhead(player)).toBeCloseTo(1.5, 10)
    expect(fired).toEqual([])

    setGuitarMuted(player, false)
    tick(player, secondsForBeats(1.5))
    // Events already crossed while muted must not dump; only later ones fire.
    expect(fired.every((b) => b > 1.5)).toBe(true)
    expect(fired).toEqual([2, 3])
  })
})

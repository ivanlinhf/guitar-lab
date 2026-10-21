import { describe, expect, it, vi } from 'vitest'
import openStringsJson from '../../songs/open-strings.json'
import { parseSongDocument } from '../score/schema.ts'
import { absoluteBeat, songLengthBeats } from '../score/time.ts'
import {
  buildTimeline,
  createPlayer,
  getPlayhead,
  onSchedule,
  pause,
  play,
  playheadSeconds,
  setPlayhead,
  setTempoRatio,
  tick,
} from './player.ts'
import type { ScheduledEvent } from './player.ts'

const song = parseSongDocument(openStringsJson)

describe('createPlayer', () => {
  it('starts at beat 0 with tempoRatio 1 and isPlaying false', () => {
    const player = createPlayer(song)
    expect(getPlayhead(player)).toBe(0)
    expect(player.tempoRatio).toBe(1)
    expect(player.isPlaying).toBe(false)
    expect(player.song).toBe(song)
  })
})

describe('buildTimeline', () => {
  it('lists note and rest starts sorted by absoluteBeat', () => {
    const timeline = buildTimeline(song)
    expect(timeline.map((e) => e.absoluteBeat)).toEqual([
      absoluteBeat(song, 1, 0),
      absoluteBeat(song, 1, 1),
      absoluteBeat(song, 1, 2),
      absoluteBeat(song, 1, 3),
      absoluteBeat(song, 2, 0),
      absoluteBeat(song, 2, 0.5),
      absoluteBeat(song, 2, 1),
      absoluteBeat(song, 2, 2),
    ])
    expect(timeline.map((e) => e.event.type)).toEqual([
      'note',
      'note',
      'note',
      'rest',
      'note',
      'note',
      'note',
      'rest',
    ])
    expect(timeline.map((e) => e.measureIndex)).toEqual([
      1, 1, 1, 1, 2, 2, 2, 2,
    ])
  })
})

describe('setPlayhead', () => {
  it('sets the absolute beat', () => {
    const player = createPlayer(song)
    setPlayhead(player, 3.25)
    expect(getPlayhead(player)).toBe(3.25)
  })

  it('clamps below 0', () => {
    const player = createPlayer(song)
    setPlayhead(player, -1)
    expect(getPlayhead(player)).toBe(0)
  })

  it('clamps above song length', () => {
    const player = createPlayer(song)
    setPlayhead(player, songLengthBeats(song) + 10)
    expect(getPlayhead(player)).toBe(songLengthBeats(song))
  })
})

describe('setTempoRatio', () => {
  it('updates tempoRatio without moving the playhead', () => {
    const player = createPlayer(song)
    setPlayhead(player, 2)
    setTempoRatio(player, 0.5)
    expect(player.tempoRatio).toBe(0.5)
    expect(getPlayhead(player)).toBe(2)
  })
})

describe('play / pause', () => {
  it('toggles isPlaying', () => {
    const player = createPlayer(song)
    play(player)
    expect(player.isPlaying).toBe(true)
    pause(player)
    expect(player.isPlaying).toBe(false)
  })
})

describe('tick', () => {
  it('does not advance when paused', () => {
    const player = createPlayer(song)
    tick(player, 1.5)
    expect(getPlayhead(player)).toBe(0)
  })

  it('advances playhead by deltaSeconds via BPM and tempoRatio', () => {
    const player = createPlayer(song)
    play(player)
    // 80 BPM, ratio 1 → 0.75 s/beat; 1.5 s → 2 beats
    tick(player, 1.5)
    expect(getPlayhead(player)).toBeCloseTo(2)
  })

  it('respects tempoRatio when advancing', () => {
    const player = createPlayer(song)
    setTempoRatio(player, 0.5)
    play(player)
    // effective 40 BPM → 1.5 s/beat; 1.5 s → 1 beat
    tick(player, 1.5)
    expect(getPlayhead(player)).toBeCloseTo(1)
  })

  it('clamps at song end', () => {
    const player = createPlayer(song)
    setPlayhead(player, songLengthBeats(song) - 0.5)
    play(player)
    tick(player, 60)
    expect(getPlayhead(player)).toBe(songLengthBeats(song))
  })
})

describe('playheadSeconds', () => {
  it('reports wall time for the current playhead', () => {
    const player = createPlayer(song)
    setPlayhead(player, 4)
    expect(playheadSeconds(player)).toBeCloseTo(3)
  })
})

describe('onSchedule', () => {
  function collectFired(player: ReturnType<typeof createPlayer>) {
    const fired: ScheduledEvent[] = []
    onSchedule(player, (e) => {
      fired.push(e)
    })
    return fired
  }

  it('fires note and rest callbacks in score order as playhead advances', () => {
    const player = createPlayer(song)
    const fired = collectFired(player)
    play(player)
    // 3.5 beats at 80 BPM → 2.625 s (through measure-1 rest, before measure 2)
    tick(player, 2.625)
    expect(fired.map((e) => e.absoluteBeat)).toEqual([0, 1, 2, 3])
    expect(fired.map((e) => e.event.type)).toEqual([
      'note',
      'note',
      'note',
      'rest',
    ])
  })

  it('fires the rest of the song in order across ticks', () => {
    const player = createPlayer(song)
    const fired = collectFired(player)
    play(player)
    tick(player, 2.625) // through measure 1
    tick(player, 3.375) // through measure 2 (8 beats total → 6 s)
    expect(fired.map((e) => e.absoluteBeat)).toEqual([
      0, 1, 2, 3, 4, 4.5, 5, 6,
    ])
    expect(fired.map((e) => e.event.type)).toEqual([
      'note',
      'note',
      'note',
      'rest',
      'note',
      'note',
      'note',
      'rest',
    ])
  })

  it('does not fire while paused', () => {
    const player = createPlayer(song)
    const listener = vi.fn()
    onSchedule(player, listener)
    tick(player, 3)
    expect(listener).not.toHaveBeenCalled()
  })

  it('after seek mid-song does not re-fire past events', () => {
    const player = createPlayer(song)
    const fired = collectFired(player)
    setPlayhead(player, 4.25)
    play(player)
    tick(player, 3)
    expect(fired.map((e) => e.absoluteBeat)).toEqual([4.5, 5, 6])
    expect(fired.every((e) => e.absoluteBeat > 4.25)).toBe(true)
  })

  it('does not fire again for events already crossed', () => {
    const player = createPlayer(song)
    const fired = collectFired(player)
    play(player)
    // 1.5 beats → playhead 1.5; events at 0 and 1
    tick(player, 1.125)
    expect(fired.map((e) => e.absoluteBeat)).toEqual([0, 1])
    tick(player, 0.1)
    expect(fired.map((e) => e.absoluteBeat)).toEqual([0, 1])
    // advance past beat 2
    tick(player, 0.65)
    expect(fired.map((e) => e.absoluteBeat)).toEqual([0, 1, 2])
  })

  it('fires no events after the song ends', () => {
    const player = createPlayer(song)
    const fired = collectFired(player)
    play(player)
    tick(player, 60)
    const countAtEnd = fired.length
    expect(countAtEnd).toBe(player.timeline.length)
    expect(getPlayhead(player)).toBe(songLengthBeats(song))
    tick(player, 60)
    expect(fired).toHaveLength(countAtEnd)
  })

  it('unsubscribe stops further callbacks', () => {
    const player = createPlayer(song)
    const listener = vi.fn()
    const unsubscribe = onSchedule(player, listener)
    play(player)
    // 0.5 beats → crosses only beat 0
    tick(player, 0.375)
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    tick(player, 1)
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

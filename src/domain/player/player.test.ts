import { describe, expect, it, vi } from 'vitest'
import openStringsJson from '../../songs/open-strings.json'
import { parseSongDocument } from '../score/schema.ts'
import {
  absoluteBeat,
  beatToSeconds,
  songLengthBeats,
} from '../score/time.ts'
import {
  TEMPO_RATIO_MAX,
  TEMPO_RATIO_MIN,
  buildTimeline,
  clampTempoRatio,
  createPlayer,
  getEffectiveBpm,
  getPlayhead,
  getTempoRatio,
  lastMeasureIndex,
  measureEndBeat,
  onSchedule,
  pause,
  play,
  playheadSeconds,
  setLoopA,
  setLoopB,
  setLoopEnabled,
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
    expect(player.loopEnabled).toBe(false)
    expect(player.loopA).toBe(1)
    expect(player.loopB).toBe(lastMeasureIndex(song))
    expect(player.countInEnabled).toBe(false)
    expect(player.countInRemainingBeats).toBe(0)
    expect(player.guitarMuted).toBe(false)
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

describe('clampTempoRatio', () => {
  it('clamps to [0.5, 1.0]', () => {
    expect(clampTempoRatio(0.25)).toBe(TEMPO_RATIO_MIN)
    expect(clampTempoRatio(0.5)).toBe(0.5)
    expect(clampTempoRatio(0.75)).toBe(0.75)
    expect(clampTempoRatio(1)).toBe(TEMPO_RATIO_MAX)
    expect(clampTempoRatio(1.5)).toBe(TEMPO_RATIO_MAX)
  })
})

describe('setTempoRatio', () => {
  it('updates tempoRatio without moving the playhead', () => {
    const player = createPlayer(song)
    setPlayhead(player, 2)
    setTempoRatio(player, 0.5)
    expect(getTempoRatio(player)).toBe(0.5)
    expect(getPlayhead(player)).toBe(2)
  })

  it('clamps below 0.5 and above 1.0', () => {
    const player = createPlayer(song)
    setTempoRatio(player, 0.1)
    expect(getTempoRatio(player)).toBe(0.5)
    setTempoRatio(player, 2)
    expect(getTempoRatio(player)).toBe(1)
  })

  it('keeps playhead beat when ratio changes during playback', () => {
    const player = createPlayer(song)
    play(player)
    tick(player, 1.5) // 2 beats at ratio 1
    expect(getPlayhead(player)).toBeCloseTo(2)
    const scheduleIndex = player.nextScheduleIndex
    setTempoRatio(player, 0.5)
    expect(getPlayhead(player)).toBeCloseTo(2)
    expect(player.nextScheduleIndex).toBe(scheduleIndex)
  })

  it('maps beatToSeconds / playheadSeconds at ratio 1.0 and 0.5', () => {
    const player = createPlayer(song)
    setPlayhead(player, 4)

    setTempoRatio(player, 1)
    expect(getEffectiveBpm(player)).toBe(song.bpm)
    expect(playheadSeconds(player)).toBeCloseTo(beatToSeconds(4, song.bpm, 1))
    expect(playheadSeconds(player)).toBeCloseTo(3)

    setTempoRatio(player, 0.5)
    expect(getEffectiveBpm(player)).toBe(song.bpm * 0.5)
    expect(playheadSeconds(player)).toBeCloseTo(beatToSeconds(4, song.bpm, 0.5))
    expect(playheadSeconds(player)).toBeCloseTo(6)
    expect(getPlayhead(player)).toBe(4)
  })

  it('after mid-playback ratio change, further ticks use effective BPM', () => {
    const player = createPlayer(song)
    play(player)
    tick(player, 1.5) // → beat 2 at ratio 1
    setTempoRatio(player, 0.5)
    // effective 40 BPM → 1.5 s/beat; 1.5 s → +1 beat
    tick(player, 1.5)
    expect(getPlayhead(player)).toBeCloseTo(3)
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

describe('A–B loop setters', () => {
  it('setLoopEnabled toggles loopEnabled', () => {
    const player = createPlayer(song)
    setLoopEnabled(player, true)
    expect(player.loopEnabled).toBe(true)
    setLoopEnabled(player, false)
    expect(player.loopEnabled).toBe(false)
  })

  it('setLoopA / setLoopB accept a valid range', () => {
    const player = createPlayer(song)
    setLoopA(player, 1)
    setLoopB(player, 2)
    expect(player.loopA).toBe(1)
    expect(player.loopB).toBe(2)
  })

  it('clamps measure indices below 1 and above last', () => {
    const player = createPlayer(song)
    const last = lastMeasureIndex(song)
    setLoopA(player, 0)
    expect(player.loopA).toBe(1)
    setLoopB(player, last + 5)
    expect(player.loopB).toBe(last)
  })

  it('rejects setLoopA when it would exceed loopB', () => {
    const player = createPlayer(song)
    setLoopA(player, 1)
    setLoopB(player, 1)
    setLoopA(player, 2)
    expect(player.loopA).toBe(1)
    expect(player.loopB).toBe(1)
  })

  it('rejects setLoopB when it would be less than loopA', () => {
    const player = createPlayer(song)
    setLoopA(player, 2)
    setLoopB(player, 2)
    setLoopB(player, 1)
    expect(player.loopA).toBe(2)
    expect(player.loopB).toBe(2)
  })

  it('allows A === B', () => {
    const player = createPlayer(song)
    setLoopA(player, 2)
    setLoopB(player, 2)
    expect(player.loopA).toBe(2)
    expect(player.loopB).toBe(2)
  })
})

describe('A–B loop tick', () => {
  /** Seconds for `beats` at song BPM and tempoRatio 1. */
  function secondsForBeats(beats: number): number {
    return beatToSeconds(beats, song.bpm, 1)
  }

  it('when disabled, plays through the end of B without wrapping', () => {
    const player = createPlayer(song)
    setLoopA(player, 1)
    setLoopB(player, 1)
    setLoopEnabled(player, false)
    setPlayhead(player, measureEndBeat(song, 1) - 0.5)
    play(player)
    tick(player, secondsForBeats(2))
    expect(getPlayhead(player)).toBeCloseTo(measureEndBeat(song, 1) + 1.5)
  })

  it('when enabled, playhead past end of B jumps to start of A', () => {
    const player = createPlayer(song)
    setLoopA(player, 1)
    setLoopB(player, 1)
    setLoopEnabled(player, true)
    setPlayhead(player, measureEndBeat(song, 1) - 0.25)
    play(player)
    // +0.5 beats → would reach endB + 0.25 → wrap to A + 0.25
    tick(player, secondsForBeats(0.5))
    expect(getPlayhead(player)).toBeCloseTo(absoluteBeat(song, 1, 0) + 0.25)
  })

  it('when A === B, wraps within that single measure', () => {
    const player = createPlayer(song)
    setLoopA(player, 2)
    setLoopB(player, 2)
    setLoopEnabled(player, true)
    const startA = absoluteBeat(song, 2, 0)
    const endB = measureEndBeat(song, 2)
    setPlayhead(player, endB - 0.1)
    play(player)
    tick(player, secondsForBeats(0.3))
    expect(getPlayhead(player)).toBeCloseTo(startA + 0.2)
  })

  it('when B is the last measure, wraps instead of clamping at song end', () => {
    const player = createPlayer(song)
    const last = lastMeasureIndex(song)
    setLoopA(player, 1)
    setLoopB(player, last)
    setLoopEnabled(player, true)
    setPlayhead(player, songLengthBeats(song) - 0.5)
    play(player)
    tick(player, secondsForBeats(1))
    expect(getPlayhead(player)).toBeCloseTo(absoluteBeat(song, 1, 0) + 0.5)
  })

  it('re-fires schedule events after wrapping to A', () => {
    const player = createPlayer(song)
    setLoopA(player, 1)
    setLoopB(player, 1)
    setLoopEnabled(player, true)
    const fired: number[] = []
    onSchedule(player, (e) => {
      fired.push(e.absoluteBeat)
    })
    setPlayhead(player, measureEndBeat(song, 1) - 0.5)
    play(player)
    // Cross end of B with enough overflow to land on beat 0 of A
    tick(player, secondsForBeats(0.5))
    expect(getPlayhead(player)).toBeCloseTo(0)
    expect(fired).toContain(0)
  })
})

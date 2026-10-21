import { describe, expect, it } from 'vitest'
import openStringsJson from '../../songs/open-strings.json'
import { parseSongDocument } from '../score/schema.ts'
import { songLengthBeats } from '../score/time.ts'
import {
  createPlayer,
  getPlayhead,
  playheadSeconds,
  setPlayhead,
  setTempoRatio,
  tick,
} from './player.ts'

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

describe('tick', () => {
  it('advances playhead by deltaSeconds via BPM and tempoRatio', () => {
    const player = createPlayer(song)
    // 80 BPM, ratio 1 → 0.75 s/beat; 1.5 s → 2 beats
    tick(player, 1.5)
    expect(getPlayhead(player)).toBeCloseTo(2)
  })

  it('respects tempoRatio when advancing', () => {
    const player = createPlayer(song)
    setTempoRatio(player, 0.5)
    // effective 40 BPM → 1.5 s/beat; 1.5 s → 1 beat
    tick(player, 1.5)
    expect(getPlayhead(player)).toBeCloseTo(1)
  })

  it('clamps at song end', () => {
    const player = createPlayer(song)
    setPlayhead(player, songLengthBeats(song) - 0.5)
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

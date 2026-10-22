import {
  advanceMetronomeBefore,
  advanceMetronomeTo,
  createMetronome,
  onMetronomeClick,
  setMetronomeEnabled as applyMetronomeEnabled,
  syncMetronomePlayhead,
  type Metronome,
  type MetronomeClickListener,
} from '../metronome/index.ts'
import {
  absoluteBeat,
  beatToSeconds,
  beatsPerMeasure,
  effectiveBpm,
  secondsToBeat,
  songLengthBeats,
} from '../score/time.ts'
import type { NoteEvent, RestEvent, SongDocument } from '../score/types.ts'

/** Inclusive practice speed bounds (50%–100% of song BPM). */
export const TEMPO_RATIO_MIN = 0.5
export const TEMPO_RATIO_MAX = 1

export function clampTempoRatio(tempoRatio: number): number {
  return Math.min(TEMPO_RATIO_MAX, Math.max(TEMPO_RATIO_MIN, tempoRatio))
}

export interface ScheduledEvent {
  absoluteBeat: number
  event: NoteEvent | RestEvent
  measureIndex: number
}

export type ScheduleListener = (scheduled: ScheduledEvent) => void

export interface Player {
  readonly song: SongDocument
  readonly timeline: ScheduledEvent[]
  playheadBeat: number
  /** Practice speed multiplier; default 1. */
  tempoRatio: number
  isPlaying: boolean
  /** When true, crossing the end of measure `loopB` seeks to the start of `loopA`. */
  loopEnabled: boolean
  /** Inclusive loop start measure (1-based). */
  loopA: number
  /** Inclusive loop end measure (1-based); must satisfy `loopA ≤ loopB`. */
  loopB: number
  /** Next timeline index to dispatch; advanced as events fire or on seek. */
  nextScheduleIndex: number
  readonly scheduleListeners: Set<ScheduleListener>
  /** Beat-aligned click clock; shares the playhead as its time source. */
  metronome: Metronome
}

/** Last measure index in the song (1-based). */
export function lastMeasureIndex(song: SongDocument): number {
  return song.measures[song.measures.length - 1]!.index
}

/** Absolute beat at the exclusive end of a measure (start of the next). */
export function measureEndBeat(
  song: SongDocument,
  measureIndex: number,
): number {
  return absoluteBeat(song, measureIndex, 0) + beatsPerMeasure(song)
}

/** Timeline of note/rest starts, sorted by absolute beat. */
export function buildTimeline(song: SongDocument): ScheduledEvent[] {
  const scheduled: ScheduledEvent[] = []
  for (const measure of song.measures) {
    for (const event of measure.events) {
      scheduled.push({
        absoluteBeat: absoluteBeat(song, measure.index, event.beat),
        event,
        measureIndex: measure.index,
      })
    }
  }
  scheduled.sort((a, b) => a.absoluteBeat - b.absoluteBeat)
  return scheduled
}

function firstScheduleIndexAtOrAfter(
  timeline: ScheduledEvent[],
  beat: number,
): number {
  let lo = 0
  let hi = timeline.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (timeline[mid]!.absoluteBeat < beat) {
      lo = mid + 1
    } else {
      hi = mid
    }
  }
  return lo
}

function dispatchUpTo(player: Player, toBeat: number): void {
  const { timeline, scheduleListeners } = player
  while (
    player.nextScheduleIndex < timeline.length &&
    timeline[player.nextScheduleIndex]!.absoluteBeat <= toBeat
  ) {
    const scheduled = timeline[player.nextScheduleIndex]!
    player.nextScheduleIndex += 1
    for (const listener of scheduleListeners) {
      listener(scheduled)
    }
  }
}

export function createPlayer(song: SongDocument): Player {
  const last = lastMeasureIndex(song)
  return {
    song,
    timeline: buildTimeline(song),
    playheadBeat: 0,
    tempoRatio: 1,
    isPlaying: false,
    loopEnabled: false,
    loopA: 1,
    loopB: last,
    nextScheduleIndex: 0,
    scheduleListeners: new Set(),
    metronome: createMetronome(0),
  }
}

export function getPlayhead(player: Player): number {
  return player.playheadBeat
}

/** Set playhead to an absolute beat, clamped to `[0, songLengthBeats]`. */
export function setPlayhead(player: Player, beat: number): Player {
  const maxBeat = songLengthBeats(player.song)
  player.playheadBeat = Math.min(Math.max(0, beat), maxBeat)
  player.nextScheduleIndex = firstScheduleIndexAtOrAfter(
    player.timeline,
    player.playheadBeat,
  )
  syncMetronomePlayhead(player.metronome, player.playheadBeat)
  return player
}

/** Whether the player's metronome will schedule clicks on beat boundaries. */
export function isMetronomeEnabled(player: Player): boolean {
  return player.metronome.enabled
}

/**
 * Enable or disable metronome clicks.
 * When enabling, realigns to the current playhead so beats skipped while
 * disabled are not dumped in a burst.
 */
export function setMetronomeEnabled(
  player: Player,
  enabled: boolean,
): Player {
  applyMetronomeEnabled(player.metronome, enabled, player.playheadBeat)
  return player
}

/**
 * Subscribe to metronome click callbacks (integer absolute beats).
 * Returns unsubscribe.
 */
export function onMetronome(
  player: Player,
  listener: MetronomeClickListener,
): () => void {
  return onMetronomeClick(player.metronome, listener)
}

export function getTempoRatio(player: Player): number {
  return player.tempoRatio
}

/** Song BPM × current practice tempo ratio. */
export function getEffectiveBpm(player: Player): number {
  return effectiveBpm(player.song.bpm, player.tempoRatio)
}

/**
 * Set practice speed, clamped to `[TEMPO_RATIO_MIN, TEMPO_RATIO_MAX]`.
 * Keeps the current absolute beat (and schedule cursor) so the playhead
 * does not jump when the ratio changes during playback.
 */
export function setTempoRatio(player: Player, tempoRatio: number): Player {
  player.tempoRatio = clampTempoRatio(tempoRatio)
  return player
}

export function setLoopEnabled(player: Player, enabled: boolean): Player {
  player.loopEnabled = enabled
  return player
}

/**
 * Set loop start measure. Clamps to `[1, lastMeasure]`.
 * Rejects (no-op) when the clamped value would be greater than `loopB`.
 */
export function setLoopA(player: Player, measureIndex: number): Player {
  const last = lastMeasureIndex(player.song)
  const clamped = Math.min(Math.max(1, Math.trunc(measureIndex)), last)
  if (clamped > player.loopB) {
    return player
  }
  player.loopA = clamped
  return player
}

/**
 * Set loop end measure. Clamps to `[1, lastMeasure]`.
 * Rejects (no-op) when the clamped value would be less than `loopA`.
 */
export function setLoopB(player: Player, measureIndex: number): Player {
  const last = lastMeasureIndex(player.song)
  const clamped = Math.min(Math.max(1, Math.trunc(measureIndex)), last)
  if (clamped < player.loopA) {
    return player
  }
  player.loopB = clamped
  return player
}

export function play(player: Player): Player {
  player.isPlaying = true
  return player
}

export function pause(player: Player): Player {
  player.isPlaying = false
  return player
}

/**
 * Subscribe to schedule callbacks. Fires once per event when the playhead
 * crosses that event's start while playing. Returns unsubscribe.
 */
export function onSchedule(
  player: Player,
  listener: ScheduleListener,
): () => void {
  player.scheduleListeners.add(listener)
  return () => {
    player.scheduleListeners.delete(listener)
  }
}

/**
 * Advance the playhead by `deltaSeconds` and dispatch crossed events.
 * No-op when not playing. Clamps at the end of the song.
 * When looping is enabled and the playhead crosses the end of `loopB`,
 * seeks to the start of `loopA` (carrying any overflow within the loop).
 */
export function tick(player: Player, deltaSeconds: number): Player {
  if (!player.isPlaying) {
    return player
  }
  const deltaBeats = secondsToBeat(
    deltaSeconds,
    player.song.bpm,
    player.tempoRatio,
  )
  const prev = player.playheadBeat
  const next = prev + deltaBeats

  if (player.loopEnabled) {
    const endB = measureEndBeat(player.song, player.loopB)
    if (prev < endB && next >= endB) {
      dispatchBefore(player, endB)
      advanceMetronomeBefore(player.metronome, endB)
      const startA = absoluteBeat(player.song, player.loopA, 0)
      const loopLen = endB - startA
      const overflow = next - endB
      const wrapped =
        loopLen > 0 ? startA + (overflow % loopLen) : startA
      setPlayhead(player, wrapped)
      dispatchUpTo(player, player.playheadBeat)
      // setPlayhead synced nextBeat from the overshot playhead; realign from
      // startA so the loop-start downbeat still clicks under rAF overflow.
      syncMetronomePlayhead(player.metronome, startA)
      advanceMetronomeTo(player.metronome, player.playheadBeat)
      return player
    }
  }

  setPlayheadWithoutReschedule(player, next)
  dispatchUpTo(player, player.playheadBeat)
  advanceMetronomeTo(player.metronome, player.playheadBeat)
  return player
}

/** Dispatch timeline events with `absoluteBeat < beforeBeat`. */
function dispatchBefore(player: Player, beforeBeat: number): void {
  const { timeline, scheduleListeners } = player
  while (
    player.nextScheduleIndex < timeline.length &&
    timeline[player.nextScheduleIndex]!.absoluteBeat < beforeBeat
  ) {
    const scheduled = timeline[player.nextScheduleIndex]!
    player.nextScheduleIndex += 1
    for (const listener of scheduleListeners) {
      listener(scheduled)
    }
  }
}

/** Move playhead without resetting the schedule cursor (used by tick). */
function setPlayheadWithoutReschedule(player: Player, beat: number): void {
  const maxBeat = songLengthBeats(player.song)
  player.playheadBeat = Math.min(Math.max(0, beat), maxBeat)
}

/** Wall-clock seconds from song start to the current playhead. */
export function playheadSeconds(player: Player): number {
  return beatToSeconds(
    player.playheadBeat,
    player.song.bpm,
    player.tempoRatio,
  )
}

import {
  absoluteBeat,
  beatToSeconds,
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
  /** Next timeline index to dispatch; advanced as events fire or on seek. */
  nextScheduleIndex: number
  readonly scheduleListeners: Set<ScheduleListener>
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
  return {
    song,
    timeline: buildTimeline(song),
    playheadBeat: 0,
    tempoRatio: 1,
    isPlaying: false,
    nextScheduleIndex: 0,
    scheduleListeners: new Set(),
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
  return player
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
  setPlayheadWithoutReschedule(player, player.playheadBeat + deltaBeats)
  dispatchUpTo(player, player.playheadBeat)
  return player
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

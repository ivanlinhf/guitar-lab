import {
  beatToSeconds,
  secondsToBeat,
  songLengthBeats,
} from '../score/time.ts'
import type { SongDocument } from '../score/types.ts'

export interface Player {
  readonly song: SongDocument
  playheadBeat: number
  /** Practice speed multiplier; default 1. */
  tempoRatio: number
  /** Playback flag; unused by the clock until scheduling is wired. */
  isPlaying: boolean
}

export function createPlayer(song: SongDocument): Player {
  return {
    song,
    playheadBeat: 0,
    tempoRatio: 1,
    isPlaying: false,
  }
}

export function getPlayhead(player: Player): number {
  return player.playheadBeat
}

/** Set playhead to an absolute beat, clamped to `[0, songLengthBeats]`. */
export function setPlayhead(player: Player, beat: number): Player {
  const maxBeat = songLengthBeats(player.song)
  player.playheadBeat = Math.min(Math.max(0, beat), maxBeat)
  return player
}

export function setTempoRatio(player: Player, tempoRatio: number): Player {
  player.tempoRatio = tempoRatio
  return player
}

/**
 * Advance the playhead by `deltaSeconds` using the song BPM and current tempo ratio.
 * Clamps at the end of the song.
 */
export function tick(player: Player, deltaSeconds: number): Player {
  const deltaBeats = secondsToBeat(
    deltaSeconds,
    player.song.bpm,
    player.tempoRatio,
  )
  return setPlayhead(player, player.playheadBeat + deltaBeats)
}

/** Wall-clock seconds from song start to the current playhead. */
export function playheadSeconds(player: Player): number {
  return beatToSeconds(
    player.playheadBeat,
    player.song.bpm,
    player.tempoRatio,
  )
}

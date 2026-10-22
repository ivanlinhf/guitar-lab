import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureAudio } from '../../audio/index.ts'
import {
  createPlayer,
  getPlayhead,
  onSchedule,
  pause,
  play,
  tick,
  type Player,
} from '../../domain/player/index.ts'
import { songLengthBeats } from '../../domain/score/index.ts'
import type { SongDocument } from '../../domain/score/types.ts'
import { soundScheduledNote } from './practicePlayback.ts'

export type UsePracticePlayerResult = {
  isPlaying: boolean
  /** Absolute beat playhead; updates each animation frame while playing. */
  playheadBeat: number
  togglePlayPause: () => void
}

/**
 * Owns a Player for the practice screen: play/pause, rAF clock, and note audio.
 */
export function usePracticePlayer(
  song: SongDocument | null,
): UsePracticePlayerResult {
  const songId = song?.id ?? null
  const playerRef = useRef<Player | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playheadBeat, setPlayheadBeat] = useState(0)
  const [loadedSongId, setLoadedSongId] = useState(songId)
  const rafIdRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  /** Guards against starting after the user paused during ensureAudio(). */
  const playGenerationRef = useRef(0)

  // Reset play state when the song identity changes (render-phase adjust).
  if (songId !== loadedSongId) {
    setLoadedSongId(songId)
    setIsPlaying(false)
    setPlayheadBeat(0)
  }

  useEffect(() => {
    playGenerationRef.current += 1
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    lastTsRef.current = null

    if (!song) {
      playerRef.current = null
      return
    }

    const player = createPlayer(song)
    playerRef.current = player
    const unsubscribe = onSchedule(player, (scheduled) => {
      soundScheduledNote(scheduled, player.song.bpm, player.tempoRatio)
    })

    return () => {
      unsubscribe()
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      if (playerRef.current === player) {
        pause(player)
        playerRef.current = null
      }
    }
  }, [song])

  const stopClock = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    lastTsRef.current = null
  }, [])

  const startClock = useCallback(() => {
    stopClock()
    const step = (timestamp: number) => {
      const player = playerRef.current
      if (!player || !player.isPlaying) {
        rafIdRef.current = null
        lastTsRef.current = null
        return
      }
      if (lastTsRef.current !== null) {
        const deltaSeconds = (timestamp - lastTsRef.current) / 1000
        tick(player, deltaSeconds)
      }
      lastTsRef.current = timestamp

      const head = getPlayhead(player)
      setPlayheadBeat(head)

      if (head >= songLengthBeats(player.song)) {
        pause(player)
        rafIdRef.current = null
        lastTsRef.current = null
        setIsPlaying(false)
        return
      }

      rafIdRef.current = requestAnimationFrame(step)
    }
    rafIdRef.current = requestAnimationFrame(step)
  }, [stopClock])

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current
    if (!player) {
      return
    }

    if (player.isPlaying) {
      playGenerationRef.current += 1
      pause(player)
      stopClock()
      setIsPlaying(false)
      return
    }

    const generation = playGenerationRef.current + 1
    playGenerationRef.current = generation

    void (async () => {
      await ensureAudio()
      if (playGenerationRef.current !== generation) {
        return
      }
      const current = playerRef.current
      if (!current || current !== player) {
        return
      }
      play(current)
      setIsPlaying(true)
      startClock()
    })()
  }, [startClock, stopClock])

  return {
    isPlaying,
    playheadBeat,
    togglePlayPause,
  }
}

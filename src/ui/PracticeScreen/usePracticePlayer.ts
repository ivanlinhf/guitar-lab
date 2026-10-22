import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureAudio } from '../../audio/index.ts'
import {
  createPlayer,
  getPlayhead,
  lastMeasureIndex,
  onSchedule,
  pause,
  play,
  setLoopA as applyLoopA,
  setLoopB as applyLoopB,
  setLoopEnabled as applyLoopEnabled,
  setTempoRatio as applyTempoRatio,
  tick,
  type Player,
} from '../../domain/player/index.ts'
import { songLengthBeats } from '../../domain/score/index.ts'
import type { SongDocument } from '../../domain/score/types.ts'
import { measureIndexFromPlayhead } from '../controls/measureIndexFromPlayhead.ts'
import { soundScheduledNote } from './practicePlayback.ts'

const LOOP_FEEDBACK_MS = 2500

export type UsePracticePlayerResult = {
  isPlaying: boolean
  /** Absolute beat playhead; updates each animation frame while playing. */
  playheadBeat: number
  /** Practice speed multiplier in `[0.5, 1]`; default `1`. */
  tempoRatio: number
  setTempoRatio: (tempoRatio: number) => void
  /** Inclusive loop start measure (1-based). */
  loopA: number
  /** Inclusive loop end measure (1-based). */
  loopB: number
  loopEnabled: boolean
  /** Set A to the measure under the playhead; returns false when rejected. */
  setLoopAToCurrentMeasure: () => boolean
  /** Set B to the measure under the playhead; returns false when rejected. */
  setLoopBToCurrentMeasure: () => boolean
  setLoopEnabled: (enabled: boolean) => void
  /** Short Chinese hint when set A/B is rejected (invalid order). */
  loopFeedback: string | null
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
  const [tempoRatio, setTempoRatioState] = useState(1)
  const [loopA, setLoopAState] = useState(1)
  const [loopB, setLoopBState] = useState(1)
  const [loopEnabled, setLoopEnabledState] = useState(false)
  const [loopFeedback, setLoopFeedback] = useState<string | null>(null)
  const [loadedSongId, setLoadedSongId] = useState(songId)
  const rafIdRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  /** Guards against starting after the user paused during ensureAudio(). */
  const playGenerationRef = useRef(0)
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset play state when the song identity changes (render-phase adjust).
  if (songId !== loadedSongId) {
    setLoadedSongId(songId)
    setIsPlaying(false)
    setPlayheadBeat(0)
    setTempoRatioState(1)
    setLoopAState(1)
    setLoopBState(song ? lastMeasureIndex(song) : 1)
    setLoopEnabledState(false)
    setLoopFeedback(null)
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

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  const showLoopFeedback = useCallback((message: string) => {
    if (feedbackTimerRef.current !== null) {
      clearTimeout(feedbackTimerRef.current)
    }
    setLoopFeedback(message)
    feedbackTimerRef.current = setTimeout(() => {
      setLoopFeedback(null)
      feedbackTimerRef.current = null
    }, LOOP_FEEDBACK_MS)
  }, [])

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

      if (!player.loopEnabled && head >= songLengthBeats(player.song)) {
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

  const setTempoRatio = useCallback((nextRatio: number) => {
    const player = playerRef.current
    if (!player) {
      return
    }
    applyTempoRatio(player, nextRatio)
    setTempoRatioState(player.tempoRatio)
  }, [])

  const setLoopAToCurrentMeasure = useCallback((): boolean => {
    const player = playerRef.current
    if (!player) {
      return false
    }
    const measure = measureIndexFromPlayhead(player.song, player.playheadBeat)
    const last = lastMeasureIndex(player.song)
    const clamped = Math.min(Math.max(1, Math.trunc(measure)), last)
    applyLoopA(player, measure)
    if (player.loopA !== clamped) {
      showLoopFeedback('A 不能大于 B')
      return false
    }
    setLoopAState(player.loopA)
    setLoopFeedback(null)
    return true
  }, [showLoopFeedback])

  const setLoopBToCurrentMeasure = useCallback((): boolean => {
    const player = playerRef.current
    if (!player) {
      return false
    }
    const measure = measureIndexFromPlayhead(player.song, player.playheadBeat)
    const last = lastMeasureIndex(player.song)
    const clamped = Math.min(Math.max(1, Math.trunc(measure)), last)
    applyLoopB(player, measure)
    if (player.loopB !== clamped) {
      showLoopFeedback('B 不能小于 A')
      return false
    }
    setLoopBState(player.loopB)
    setLoopFeedback(null)
    return true
  }, [showLoopFeedback])

  const setLoopEnabled = useCallback((enabled: boolean) => {
    const player = playerRef.current
    if (!player) {
      return
    }
    applyLoopEnabled(player, enabled)
    setLoopEnabledState(player.loopEnabled)
  }, [])

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
    tempoRatio,
    setTempoRatio,
    loopA,
    loopB,
    loopEnabled,
    setLoopAToCurrentMeasure,
    setLoopBToCurrentMeasure,
    setLoopEnabled,
    loopFeedback,
    togglePlayPause,
  }
}

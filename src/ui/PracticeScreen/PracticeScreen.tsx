import { useEffect, useMemo, useRef, useState } from 'react'
import { getSongById } from '../../domain/library/index.ts'
import {
  TabSvg,
  measuresPerRowForWidth,
  rowIndexFromPlayhead,
  scrollTopForPlayheadRow,
} from '../../render/tabSvg/index.ts'
import {
  ControlBar,
  measureIndexFromPlayhead,
} from '../controls/index.ts'
import { BigFretPanel } from './BigFretPanel.tsx'
import './PracticeScreen.css'
import { handleSpacePlayPauseKeyDown } from './handleSpacePlayPauseKeyDown.ts'
import { usePracticePlayer } from './usePracticePlayer.ts'

export type PracticeScreenProps = {
  songId: string
  onBack: () => void
}

export function PracticeScreen({ songId, onBack }: PracticeScreenProps) {
  const song = useMemo(() => getSongById(songId), [songId])
  const title = song?.title ?? songId
  const bpm = song?.bpm
  const {
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
    metronomeEnabled,
    setMetronomeEnabled,
    countInEnabled,
    setCountInEnabled,
    guitarMuted,
    setGuitarMuted,
    loopFeedback,
    seekToMeasure,
    togglePlayPause,
  } = usePracticePlayer(song)

  /** Default off: TAB-only until the learner turns「大品格」on. */
  const [bigFretEnabled, setBigFretEnabled] = useState(false)
  const scoreScrollRef = useRef<HTMLDivElement | null>(null)
  const [scoreContentWidth, setScoreContentWidth] = useState(0)

  // Space toggles play/pause on Practice; skip when focus is editable.
  useEffect(() => {
    if (!song) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      handleSpacePlayPauseKeyDown(event, togglePlayPause)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [song, togglePlayPause])

  // Measure score viewport content width for measures-per-row wrapping.
  useEffect(() => {
    const el = scoreScrollRef.current
    if (!el) {
      return
    }

    const updateWidth = () => {
      const style = getComputedStyle(el)
      const padX =
        (Number.parseFloat(style.paddingLeft) || 0) +
        (Number.parseFloat(style.paddingRight) || 0)
      setScoreContentWidth(Math.max(0, el.clientWidth - padX))
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(el)
    return () => {
      observer.disconnect()
    }
  }, [songId, bigFretEnabled])

  const measuresPerRow = useMemo(() => {
    if (!song || scoreContentWidth <= 0) {
      return undefined
    }
    return measuresPerRowForWidth(
      scoreContentWidth,
      song.timeSignature.numerator,
    )
  }, [song, scoreContentWidth])

  // Keep the playhead's wrapped row in view during playback (and seeks).
  useEffect(() => {
    const el = scoreScrollRef.current
    if (!el || !song || measuresPerRow === undefined) {
      return
    }
    const row = rowIndexFromPlayhead(
      playheadBeat,
      song.timeSignature.numerator,
      song.measures.length,
      measuresPerRow,
    )
    const style = getComputedStyle(el)
    const padY =
      (Number.parseFloat(style.paddingTop) || 0) +
      (Number.parseFloat(style.paddingBottom) || 0)
    const viewportHeight = Math.max(0, el.clientHeight - padY)
    const nextTop = scrollTopForPlayheadRow(row, viewportHeight, el.scrollTop)
    if (nextTop !== el.scrollTop) {
      el.scrollTop = nextTop
    }
  }, [song, playheadBeat, measuresPerRow])

  const currentMeasure = song
    ? measureIndexFromPlayhead(song, playheadBeat)
    : undefined
  const measureTotal = song ? song.measures.length : undefined

  return (
    <div className="practice-screen">
      <header className="practice-screen__top">
        <button
          type="button"
          className="practice-screen__back"
          onClick={onBack}
        >
          <span className="practice-screen__back-chevron" aria-hidden="true">
            ‹
          </span>
          返回
        </button>
        <h1 className="practice-screen__title">{title}</h1>
        {bpm !== undefined ? (
          <span className="practice-screen__bpm">
            <span className="practice-screen__bpm-label">BPM</span>{' '}
            <span className="practice-screen__bpm-value">{bpm}</span>
          </span>
        ) : null}
      </header>

      <div className="practice-screen__score">
        {bigFretEnabled && song ? (
          <BigFretPanel song={song} playheadBeat={playheadBeat} />
        ) : null}
        <div className="practice-screen__score-scroll" ref={scoreScrollRef}>
          {song ? (
            <div className="practice-screen__score-inner">
              <TabSvg
                song={song}
                playheadBeat={playheadBeat}
                measuresPerRow={measuresPerRow}
              />
            </div>
          ) : (
            <p className="practice-screen__missing">未找到该曲目</p>
          )}
        </div>
      </div>

      <footer className="practice-screen__bottom">
        <ControlBar
          isPlaying={isPlaying}
          onPlayPause={song ? togglePlayPause : undefined}
          tempoRatio={tempoRatio}
          onTempoRatioChange={song ? setTempoRatio : undefined}
          loopA={loopA}
          loopB={loopB}
          loopEnabled={loopEnabled}
          onSetLoopA={song ? setLoopAToCurrentMeasure : undefined}
          onSetLoopB={song ? setLoopBToCurrentMeasure : undefined}
          onLoopEnabledChange={song ? setLoopEnabled : undefined}
          loopFeedback={loopFeedback}
          metronomeEnabled={metronomeEnabled}
          onMetronomeEnabledChange={song ? setMetronomeEnabled : undefined}
          countInEnabled={countInEnabled}
          onCountInEnabledChange={song ? setCountInEnabled : undefined}
          guitarMuted={guitarMuted}
          onGuitarMutedChange={song ? setGuitarMuted : undefined}
          bigFretEnabled={bigFretEnabled}
          onBigFretEnabledChange={song ? setBigFretEnabled : undefined}
          currentMeasure={currentMeasure}
          measureTotal={measureTotal}
          onSeekToMeasure={song ? seekToMeasure : undefined}
        />
      </footer>
    </div>
  )
}

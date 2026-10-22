import { useMemo, useState } from 'react'
import { getSongById } from '../../domain/library/index.ts'
import { TabSvg } from '../../render/tabSvg/index.ts'
import {
  ControlBar,
  measureIndexFromPlayhead,
} from '../controls/index.ts'
import { BigFretPanel } from './BigFretPanel.tsx'
import './PracticeScreen.css'
import { usePracticePlayer } from './usePracticePlayer.ts'

export type PracticeScreenProps = {
  songId: string
  onBack: () => void
}

export function PracticeScreen({ songId, onBack }: PracticeScreenProps) {
  const song = useMemo(() => getSongById(songId), [songId])
  const title = song?.title ?? songId
  const bpmLabel = song ? `BPM ${song.bpm}` : null
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
          返回
        </button>
        <h1 className="practice-screen__title">{title}</h1>
        {bpmLabel ? (
          <span className="practice-screen__bpm">{bpmLabel}</span>
        ) : null}
      </header>

      <div className="practice-screen__score">
        {bigFretEnabled && song ? (
          <BigFretPanel song={song} playheadBeat={playheadBeat} />
        ) : null}
        <div className="practice-screen__score-scroll">
          {song ? (
            <div className="practice-screen__score-inner">
              <TabSvg song={song} playheadBeat={playheadBeat} />
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

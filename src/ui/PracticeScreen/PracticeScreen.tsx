import { useMemo } from 'react'
import { getSongById } from '../../domain/library/index.ts'
import { TabSvg } from '../../render/tabSvg/index.ts'
import { ControlBar } from '../controls/index.ts'
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
  const { isPlaying, playheadBeat, togglePlayPause } = usePracticePlayer(song)

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
        {song ? (
          <div className="practice-screen__score-inner">
            <TabSvg song={song} playheadBeat={playheadBeat} />
          </div>
        ) : (
          <p className="practice-screen__missing">未找到该曲目</p>
        )}
      </div>

      <footer className="practice-screen__bottom">
        <ControlBar
          isPlaying={isPlaying}
          onPlayPause={song ? togglePlayPause : undefined}
        />
      </footer>
    </div>
  )
}

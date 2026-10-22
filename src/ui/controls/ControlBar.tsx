import './ControlBar.css'
import { AbLoopControls } from './AbLoopControls.tsx'
import { controlBarCopy } from './copy.ts'
import { MeasureProgress } from './MeasureProgress.tsx'
import { BigFretToggle } from './BigFretToggle.tsx'
import { ClickOnlyToggle } from './ClickOnlyToggle.tsx'
import { CountInToggle } from './CountInToggle.tsx'
import { MetronomeToggle } from './MetronomeToggle.tsx'
import { TempoSlider } from './TempoSlider.tsx'

export type ControlBarProps = {
  /** When true, the play button shows「暂停」; otherwise「播放」. */
  isPlaying?: boolean
  /** Wired play/pause handler; when omitted the play button stays disabled. */
  onPlayPause?: () => void
  /** Current practice tempo ratio (`0.5`–`1`). */
  tempoRatio?: number
  /** Called when the速度 slider changes; when omitted the slider stays disabled. */
  onTempoRatioChange?: (tempoRatio: number) => void
  /** Inclusive loop start measure (1-based). */
  loopA?: number
  /** Inclusive loop end measure (1-based). */
  loopB?: number
  loopEnabled?: boolean
  onSetLoopA?: () => void
  onSetLoopB?: () => void
  onLoopEnabledChange?: (enabled: boolean) => void
  /** Brief message when set A/B is rejected. */
  loopFeedback?: string | null
  /** Metronome on/off. */
  metronomeEnabled?: boolean
  /** Called when the节拍器 toggle changes; when omitted the control stays disabled. */
  onMetronomeEnabledChange?: (enabled: boolean) => void
  /** Count-in on/off. */
  countInEnabled?: boolean
  /** Called when the预备拍 toggle changes; when omitted the control stays disabled. */
  onCountInEnabledChange?: (enabled: boolean) => void
  /** Click-only (mute guitar) on/off. */
  guitarMuted?: boolean
  /** Called when the仅节拍 toggle changes; when omitted the control stays disabled. */
  onGuitarMutedChange?: (muted: boolean) => void
  /** Large string+fret novice panel on/off (default off). */
  bigFretEnabled?: boolean
  /** Called when the大品格 toggle changes; when omitted the control stays disabled. */
  onBigFretEnabledChange?: (enabled: boolean) => void
  /** 1-based measure at the playhead; when set with measureTotal, shows progress. */
  currentMeasure?: number
  /** Total measures (`measures.length`); omit with currentMeasure for the placeholder. */
  measureTotal?: number
  /** Seek to a 1-based measure start; omit to keep the scrub disabled. */
  onSeekToMeasure?: (measureIndex: number) => void
}

/**
 * Fixed practice bottom bar, L→R:
 * 播放/暂停 → 速度 → A–B → 节拍器 → 预备拍 → 仅节拍 → 大品格 → 小节/scrub.
 */
export function ControlBar({
  isPlaying = false,
  onPlayPause,
  tempoRatio = 1,
  onTempoRatioChange,
  loopA = 1,
  loopB = 1,
  loopEnabled = false,
  onSetLoopA,
  onSetLoopB,
  onLoopEnabledChange,
  loopFeedback = null,
  metronomeEnabled = false,
  onMetronomeEnabledChange,
  countInEnabled = false,
  onCountInEnabledChange,
  guitarMuted = false,
  onGuitarMutedChange,
  bigFretEnabled = false,
  onBigFretEnabledChange,
  currentMeasure,
  measureTotal,
  onSeekToMeasure,
}: ControlBarProps) {
  const playEnabled = onPlayPause !== undefined
  const showMeasureProgress =
    currentMeasure !== undefined && measureTotal !== undefined

  return (
    <div className="control-bar" role="toolbar" aria-label={controlBarCopy.toolbarLabel}>
      <button
        type="button"
        className={
          playEnabled
            ? 'control-bar__item control-bar__item--active'
            : 'control-bar__item'
        }
        disabled={!playEnabled}
        onClick={onPlayPause}
        aria-pressed={playEnabled ? isPlaying : undefined}
      >
        {isPlaying ? controlBarCopy.pause : controlBarCopy.play}
      </button>
      <TempoSlider
        tempoRatio={tempoRatio}
        onTempoRatioChange={onTempoRatioChange}
      />
      <AbLoopControls
        loopA={loopA}
        loopB={loopB}
        loopEnabled={loopEnabled}
        onSetLoopA={onSetLoopA}
        onSetLoopB={onSetLoopB}
        onLoopEnabledChange={onLoopEnabledChange}
        feedback={loopFeedback}
      />
      <MetronomeToggle
        metronomeEnabled={metronomeEnabled}
        onMetronomeEnabledChange={onMetronomeEnabledChange}
      />
      <CountInToggle
        countInEnabled={countInEnabled}
        onCountInEnabledChange={onCountInEnabledChange}
      />
      <ClickOnlyToggle
        guitarMuted={guitarMuted}
        onGuitarMutedChange={onGuitarMutedChange}
      />
      <BigFretToggle
        bigFretEnabled={bigFretEnabled}
        onBigFretEnabledChange={onBigFretEnabledChange}
      />
      {showMeasureProgress ? (
        <MeasureProgress
          currentMeasure={currentMeasure}
          totalMeasures={measureTotal}
          onSeekToMeasure={onSeekToMeasure}
        />
      ) : (
        <button type="button" className="control-bar__item" disabled>
          {controlBarCopy.measure}
        </button>
      )}
    </div>
  )
}

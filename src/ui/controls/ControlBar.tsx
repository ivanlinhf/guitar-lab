import './ControlBar.css'
import { AbLoopControls } from './AbLoopControls.tsx'
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
}

/** Fixed practice bottom bar — play/pause, tempo, and A–B are live; others are placeholders. */
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
}: ControlBarProps) {
  const playEnabled = onPlayPause !== undefined

  return (
    <div className="control-bar" role="toolbar" aria-label="练习控件">
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
        {isPlaying ? '暂停' : '播放'}
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
      <button type="button" className="control-bar__item" disabled>
        节拍器
      </button>
      <button type="button" className="control-bar__item" disabled>
        小节
      </button>
    </div>
  )
}

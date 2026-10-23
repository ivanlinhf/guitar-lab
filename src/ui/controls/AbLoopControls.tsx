import './AbLoopControls.css'
import { controlBarCopy } from './copy.ts'

export type AbLoopControlsProps = {
  /** Inclusive loop start measure (1-based). */
  loopA: number
  /** Inclusive loop end measure (1-based). */
  loopB: number
  /** When true, playback wraps from the end of B back to A. */
  loopEnabled: boolean
  /** Set A to the current playhead measure; omit to disable. */
  onSetLoopA?: () => void
  /** Set B to the current playhead measure; omit to disable. */
  onSetLoopB?: () => void
  /** Toggle A–B looping; omit to disable. */
  onLoopEnabledChange?: (enabled: boolean) => void
  /** Brief message when a set is rejected (e.g. invalid A/B order). */
  feedback?: string | null
}

/** Bottom-bar A–B controls: loop toggle, set A/B from current measure, range display. */
export function AbLoopControls({
  loopA,
  loopB,
  loopEnabled,
  onSetLoopA,
  onSetLoopB,
  onLoopEnabledChange,
  feedback = null,
}: AbLoopControlsProps) {
  const wired =
    onSetLoopA !== undefined &&
    onSetLoopB !== undefined &&
    onLoopEnabledChange !== undefined
  /** 「设为 A/B」only when the loop is on (and handlers are wired). */
  const canSetMarks = wired && loopEnabled

  return (
    <div
      className={
        wired ? 'ab-loop-controls' : 'ab-loop-controls ab-loop-controls--disabled'
      }
      role="group"
      aria-label={controlBarCopy.abLoop}
    >
      <button
        type="button"
        className="control-bar__toggle"
        disabled={!wired}
        aria-pressed={wired ? loopEnabled : undefined}
        onClick={() => onLoopEnabledChange?.(!loopEnabled)}
      >
        {controlBarCopy.abLoop}
      </button>
      <button
        type="button"
        className={
          canSetMarks
            ? 'control-bar__item control-bar__item--active'
            : 'control-bar__item'
        }
        disabled={!canSetMarks}
        onClick={onSetLoopA}
      >
        {controlBarCopy.setA}
      </button>
      <button
        type="button"
        className={
          canSetMarks
            ? 'control-bar__item control-bar__item--active'
            : 'control-bar__item'
        }
        disabled={!canSetMarks}
        onClick={onSetLoopB}
      >
        {controlBarCopy.setB}
      </button>
      <span
        className={
          feedback
            ? 'ab-loop-controls__range ab-loop-controls__range--feedback'
            : 'ab-loop-controls__range'
        }
        role={feedback ? 'status' : undefined}
        aria-live="polite"
      >
        {feedback ??
          `A${loopA}–B${loopB}${loopEnabled ? ` · ${controlBarCopy.on}` : ` · ${controlBarCopy.off}`}`}
      </span>
    </div>
  )
}

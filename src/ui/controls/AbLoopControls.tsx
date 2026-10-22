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
  const enabled = onSetLoopA !== undefined && onSetLoopB !== undefined &&
    onLoopEnabledChange !== undefined
  const itemClass = enabled
    ? 'control-bar__item control-bar__item--active'
    : 'control-bar__item'

  return (
    <div
      className={
        enabled ? 'ab-loop-controls' : 'ab-loop-controls ab-loop-controls--disabled'
      }
      role="group"
      aria-label={controlBarCopy.abLoop}
    >
      <button
        type="button"
        className={itemClass}
        disabled={!enabled}
        aria-pressed={enabled ? loopEnabled : undefined}
        onClick={() => onLoopEnabledChange?.(!loopEnabled)}
      >
        {controlBarCopy.abLoop}
      </button>
      <button
        type="button"
        className={itemClass}
        disabled={!enabled}
        onClick={onSetLoopA}
      >
        {controlBarCopy.setA}
      </button>
      <button
        type="button"
        className={itemClass}
        disabled={!enabled}
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

import './AbLoopControls.css'

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

/** Bottom-bar A–B controls: set A/B from current measure, loop toggle, range display. */
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

  return (
    <div
      className={
        enabled ? 'ab-loop-controls' : 'ab-loop-controls ab-loop-controls--disabled'
      }
      role="group"
      aria-label="A–B 循环"
    >
      <button
        type="button"
        className={
          enabled
            ? 'control-bar__item control-bar__item--active'
            : 'control-bar__item'
        }
        disabled={!enabled}
        onClick={onSetLoopA}
      >
        设为 A
      </button>
      <button
        type="button"
        className={
          enabled
            ? 'control-bar__item control-bar__item--active'
            : 'control-bar__item'
        }
        disabled={!enabled}
        onClick={onSetLoopB}
      >
        设为 B
      </button>
      <button
        type="button"
        className={
          enabled
            ? 'control-bar__item control-bar__item--active'
            : 'control-bar__item'
        }
        disabled={!enabled}
        aria-pressed={enabled ? loopEnabled : undefined}
        onClick={() => onLoopEnabledChange?.(!loopEnabled)}
      >
        A–B 循环
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
          `A${loopA}–B${loopB}${loopEnabled ? ' · 开' : ' · 关'}`}
      </span>
    </div>
  )
}

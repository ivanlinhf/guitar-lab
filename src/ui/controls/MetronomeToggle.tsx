import './MetronomeToggle.css'
import { controlBarCopy } from './copy.ts'

export type MetronomeToggleProps = {
  /** When true, the player schedules a click on each integer beat. */
  metronomeEnabled: boolean
  /** Toggle metronome; omit to disable the control. */
  onMetronomeEnabledChange?: (enabled: boolean) => void
}

/** Bottom-bar「节拍器」on/off control with 开/关 label. */
export function MetronomeToggle({
  metronomeEnabled,
  onMetronomeEnabledChange,
}: MetronomeToggleProps) {
  const enabled = onMetronomeEnabledChange !== undefined

  return (
    <div
      className={
        enabled
          ? 'metronome-toggle'
          : 'metronome-toggle metronome-toggle--disabled'
      }
      role="group"
      aria-label={controlBarCopy.metronome}
    >
      <button
        type="button"
        className={
          enabled
            ? 'control-bar__item control-bar__item--active'
            : 'control-bar__item'
        }
        disabled={!enabled}
        aria-pressed={enabled ? metronomeEnabled : undefined}
        onClick={() => onMetronomeEnabledChange?.(!metronomeEnabled)}
      >
        {controlBarCopy.metronome}
      </button>
      <span className="metronome-toggle__state" aria-live="polite">
        {metronomeEnabled ? controlBarCopy.on : controlBarCopy.off}
      </span>
    </div>
  )
}

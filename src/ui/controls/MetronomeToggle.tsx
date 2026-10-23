import './MetronomeToggle.css'
import { controlBarCopy } from './copy.ts'

export type MetronomeToggleProps = {
  /** When true, the player schedules a click on each integer beat. */
  metronomeEnabled: boolean
  /** Toggle metronome; omit to disable the control. */
  onMetronomeEnabledChange?: (enabled: boolean) => void
}

/** Bottom-bar「节拍器」on/off chip with status dot. */
export function MetronomeToggle({
  metronomeEnabled,
  onMetronomeEnabledChange,
}: MetronomeToggleProps) {
  const enabled = onMetronomeEnabledChange !== undefined

  return (
    <button
      type="button"
      className="control-bar__toggle metronome-toggle"
      disabled={!enabled}
      aria-pressed={enabled ? metronomeEnabled : undefined}
      aria-label={controlBarCopy.metronome}
      onClick={() => onMetronomeEnabledChange?.(!metronomeEnabled)}
    >
      {controlBarCopy.metronome}
    </button>
  )
}

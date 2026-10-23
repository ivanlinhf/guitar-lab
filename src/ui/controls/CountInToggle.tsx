import './CountInToggle.css'
import { controlBarCopy } from './copy.ts'

export type CountInToggleProps = {
  /** When true, play starts with a one-measure count-in before guitar. */
  countInEnabled: boolean
  /** Toggle count-in; omit to disable the control. */
  onCountInEnabledChange?: (enabled: boolean) => void
}

/** Bottom-bar「预备拍」on/off chip with status dot. */
export function CountInToggle({
  countInEnabled,
  onCountInEnabledChange,
}: CountInToggleProps) {
  const enabled = onCountInEnabledChange !== undefined

  return (
    <button
      type="button"
      className="control-bar__toggle count-in-toggle"
      disabled={!enabled}
      aria-pressed={enabled ? countInEnabled : undefined}
      aria-label={controlBarCopy.countIn}
      onClick={() => onCountInEnabledChange?.(!countInEnabled)}
    >
      {controlBarCopy.countIn}
    </button>
  )
}

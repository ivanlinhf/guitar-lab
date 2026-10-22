import './CountInToggle.css'
import { controlBarCopy } from './copy.ts'

export type CountInToggleProps = {
  /** When true, play starts with a one-measure count-in before guitar. */
  countInEnabled: boolean
  /** Toggle count-in; omit to disable the control. */
  onCountInEnabledChange?: (enabled: boolean) => void
}

/** Bottom-bar「预备拍」on/off control with 开/关 label. */
export function CountInToggle({
  countInEnabled,
  onCountInEnabledChange,
}: CountInToggleProps) {
  const enabled = onCountInEnabledChange !== undefined

  return (
    <div
      className={
        enabled
          ? 'count-in-toggle'
          : 'count-in-toggle count-in-toggle--disabled'
      }
      role="group"
      aria-label={controlBarCopy.countIn}
    >
      <button
        type="button"
        className={
          enabled
            ? 'control-bar__item control-bar__item--active'
            : 'control-bar__item'
        }
        disabled={!enabled}
        aria-pressed={enabled ? countInEnabled : undefined}
        onClick={() => onCountInEnabledChange?.(!countInEnabled)}
      >
        {controlBarCopy.countIn}
      </button>
      <span className="count-in-toggle__state" aria-live="polite">
        {countInEnabled ? controlBarCopy.on : controlBarCopy.off}
      </span>
    </div>
  )
}

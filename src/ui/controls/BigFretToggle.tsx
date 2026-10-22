import './BigFretToggle.css'
import { controlBarCopy } from './copy.ts'

export type BigFretToggleProps = {
  /** When true, the large string+fret novice panel is visible. */
  bigFretEnabled: boolean
  /** Toggle the panel; omit to disable the control. */
  onBigFretEnabledChange?: (enabled: boolean) => void
}

/** Bottom-bar「大品格」on/off control with 开/关 label. Default off. */
export function BigFretToggle({
  bigFretEnabled,
  onBigFretEnabledChange,
}: BigFretToggleProps) {
  const enabled = onBigFretEnabledChange !== undefined

  return (
    <div
      className={
        enabled
          ? 'big-fret-toggle'
          : 'big-fret-toggle big-fret-toggle--disabled'
      }
      role="group"
      aria-label={controlBarCopy.bigFret}
    >
      <button
        type="button"
        className={
          enabled
            ? 'control-bar__item control-bar__item--active'
            : 'control-bar__item'
        }
        disabled={!enabled}
        aria-pressed={enabled ? bigFretEnabled : undefined}
        onClick={() => onBigFretEnabledChange?.(!bigFretEnabled)}
      >
        {controlBarCopy.bigFret}
      </button>
      <span className="big-fret-toggle__state" aria-live="polite">
        {bigFretEnabled ? controlBarCopy.on : controlBarCopy.off}
      </span>
    </div>
  )
}

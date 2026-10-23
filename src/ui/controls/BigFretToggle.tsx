import './BigFretToggle.css'
import { controlBarCopy } from './copy.ts'

export type BigFretToggleProps = {
  /** When true, the large string+fret novice panel is visible. */
  bigFretEnabled: boolean
  /** Toggle the panel; omit to disable the control. */
  onBigFretEnabledChange?: (enabled: boolean) => void
}

/** Bottom-bar「大品格」on/off chip with status dot. Default off. */
export function BigFretToggle({
  bigFretEnabled,
  onBigFretEnabledChange,
}: BigFretToggleProps) {
  const enabled = onBigFretEnabledChange !== undefined

  return (
    <button
      type="button"
      className="control-bar__toggle big-fret-toggle"
      disabled={!enabled}
      aria-pressed={enabled ? bigFretEnabled : undefined}
      aria-label={controlBarCopy.bigFret}
      onClick={() => onBigFretEnabledChange?.(!bigFretEnabled)}
    >
      {controlBarCopy.bigFret}
    </button>
  )
}

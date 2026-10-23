import './ClickOnlyToggle.css'
import { controlBarCopy } from './copy.ts'

export type ClickOnlyToggleProps = {
  /**
   * When true, guitar schedule is muted (「仅节拍」on).
   * Metronome clicks still play when the metronome is enabled.
   */
  guitarMuted: boolean
  /** Toggle click-only; omit to disable the control. */
  onGuitarMutedChange?: (muted: boolean) => void
}

/** Bottom-bar「仅节拍」on/off chip with status dot. */
export function ClickOnlyToggle({
  guitarMuted,
  onGuitarMutedChange,
}: ClickOnlyToggleProps) {
  const enabled = onGuitarMutedChange !== undefined

  return (
    <button
      type="button"
      className="control-bar__toggle click-only-toggle"
      disabled={!enabled}
      aria-pressed={enabled ? guitarMuted : undefined}
      aria-label={controlBarCopy.clickOnly}
      onClick={() => onGuitarMutedChange?.(!guitarMuted)}
    >
      {controlBarCopy.clickOnly}
    </button>
  )
}

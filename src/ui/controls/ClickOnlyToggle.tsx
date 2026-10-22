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

/** Bottom-bar「仅节拍」on/off control with 开/关 label. */
export function ClickOnlyToggle({
  guitarMuted,
  onGuitarMutedChange,
}: ClickOnlyToggleProps) {
  const enabled = onGuitarMutedChange !== undefined

  return (
    <div
      className={
        enabled
          ? 'click-only-toggle'
          : 'click-only-toggle click-only-toggle--disabled'
      }
      role="group"
      aria-label={controlBarCopy.clickOnly}
    >
      <button
        type="button"
        className={
          enabled
            ? 'control-bar__item control-bar__item--active'
            : 'control-bar__item'
        }
        disabled={!enabled}
        aria-pressed={enabled ? guitarMuted : undefined}
        onClick={() => onGuitarMutedChange?.(!guitarMuted)}
      >
        {controlBarCopy.clickOnly}
      </button>
      <span className="click-only-toggle__state" aria-live="polite">
        {guitarMuted ? controlBarCopy.on : controlBarCopy.off}
      </span>
    </div>
  )
}

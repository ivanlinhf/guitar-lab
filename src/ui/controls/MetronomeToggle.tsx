import './MetronomeToggle.css'

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
      aria-label="节拍器"
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
        节拍器
      </button>
      <span className="metronome-toggle__state" aria-live="polite">
        {metronomeEnabled ? '开' : '关'}
      </span>
    </div>
  )
}

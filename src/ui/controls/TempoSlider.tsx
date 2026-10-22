import './TempoSlider.css'
import { controlBarCopy } from './copy.ts'
import {
  TEMPO_PERCENT_MAX,
  TEMPO_PERCENT_MIN,
  percentToTempoRatio,
  tempoRatioToPercent,
} from './tempoPercent.ts'

export type TempoSliderProps = {
  /** Practice tempo ratio in `[0.5, 1]`; displayed as a percent. */
  tempoRatio: number
  /** Called with the new ratio when the slider moves; omit to disable. */
  onTempoRatioChange?: (tempoRatio: number) => void
}

/** Bottom-bar「速度」control: label, range input (50%–100%), and current percent. */
export function TempoSlider({
  tempoRatio,
  onTempoRatioChange,
}: TempoSliderProps) {
  const percent = tempoRatioToPercent(tempoRatio)
  const disabled = onTempoRatioChange === undefined

  return (
    <div
      className={
        disabled
          ? 'tempo-slider tempo-slider--disabled'
          : 'tempo-slider'
      }
    >
      <label className="tempo-slider__label" htmlFor="practice-tempo">
        {controlBarCopy.tempo}
      </label>
      <input
        id="practice-tempo"
        className="tempo-slider__range"
        type="range"
        min={TEMPO_PERCENT_MIN}
        max={TEMPO_PERCENT_MAX}
        step={1}
        value={percent}
        disabled={disabled}
        aria-valuemin={TEMPO_PERCENT_MIN}
        aria-valuemax={TEMPO_PERCENT_MAX}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%`}
        onChange={(event) => {
          onTempoRatioChange?.(
            percentToTempoRatio(Number(event.target.value)),
          )
        }}
      />
      <span className="tempo-slider__value" aria-live="polite">
        {percent}%
      </span>
    </div>
  )
}

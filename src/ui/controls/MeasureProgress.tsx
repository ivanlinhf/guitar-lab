import './MeasureProgress.css'

export type MeasureProgressProps = {
  /** 1-based measure containing the playhead. */
  currentMeasure: number
  /** Total measures in the song (`measures.length`). */
  totalMeasures: number
  /** Seek to a 1-based measure start; omit to keep the scrub disabled. */
  onSeekToMeasure?: (measureIndex: number) => void
}

/** Bottom-bar「小节 n / total」label plus measure-step scrub. */
export function MeasureProgress({
  currentMeasure,
  totalMeasures,
  onSeekToMeasure,
}: MeasureProgressProps) {
  const disabled = onSeekToMeasure === undefined
  const max = Math.max(1, totalMeasures)
  const value = Math.min(Math.max(1, currentMeasure), max)

  return (
    <div
      className={
        disabled
          ? 'measure-progress measure-progress--disabled'
          : 'measure-progress'
      }
    >
      <label className="measure-progress__label" htmlFor="practice-measure-scrub">
        小节 {value} / {max}
      </label>
      <input
        id="practice-measure-scrub"
        className="measure-progress__range"
        type="range"
        min={1}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        aria-label="小节进度"
        aria-valuemin={1}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`小节 ${value} / ${max}`}
        onChange={(event) => {
          onSeekToMeasure?.(Number(event.target.value))
        }}
      />
    </div>
  )
}

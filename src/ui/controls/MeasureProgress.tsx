import './MeasureProgress.css'

export type MeasureProgressProps = {
  /** 1-based measure containing the playhead. */
  currentMeasure: number
  /** Total measures in the song (`measures.length`). */
  totalMeasures: number
}

/** Bottom-bar read-only「小节 n / total」label (scrub comes later). */
export function MeasureProgress({
  currentMeasure,
  totalMeasures,
}: MeasureProgressProps) {
  return (
    <div
      className="measure-progress"
      role="status"
      aria-label="小节进度"
      aria-live="polite"
    >
      <span className="measure-progress__label">
        小节 {currentMeasure} / {totalMeasures}
      </span>
    </div>
  )
}

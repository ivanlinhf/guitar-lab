import {
  bigFretDisplay,
  type BigFretFinger,
} from '../../domain/score/bigFretDisplay.ts'
import type { SongDocument } from '../../domain/score/types.ts'
import './BigFretPanel.css'

export type BigFretPanelProps = {
  song: SongDocument
  playheadBeat: number
}

const panelCopy = {
  label: '大品格',
  current: '当前',
  next: '下一',
  empty: '—',
  string: (n: number) => `${n}弦`,
  fret: (n: number) => (n === 0 ? '空弦' : `${n}品`),
} as const

function FingerRows({ fingers }: { fingers: BigFretFinger[] }) {
  if (fingers.length === 0) {
    return <p className="big-fret-panel__empty">{panelCopy.empty}</p>
  }
  return (
    <ul className="big-fret-panel__fingers">
      {fingers.map((f) => (
        <li
          key={`${f.string}-${f.fret}`}
          className="big-fret-panel__finger"
        >
          <span className="big-fret-panel__string">
            {panelCopy.string(f.string)}
          </span>
          <span className="big-fret-panel__fret">{panelCopy.fret(f.fret)}</span>
        </li>
      ))}
    </ul>
  )
}

/** Large string+fret novice panel for the current and next notes. */
export function BigFretPanel({ song, playheadBeat }: BigFretPanelProps) {
  const display = bigFretDisplay(song, playheadBeat)

  return (
    <aside
      className="big-fret-panel"
      aria-label={panelCopy.label}
    >
      <section className="big-fret-panel__block" aria-label={panelCopy.current}>
        <h2 className="big-fret-panel__heading">{panelCopy.current}</h2>
        <FingerRows fingers={display.current} />
      </section>
      <section className="big-fret-panel__block" aria-label={panelCopy.next}>
        <h2 className="big-fret-panel__heading">{panelCopy.next}</h2>
        <FingerRows fingers={display.next} />
      </section>
    </aside>
  )
}

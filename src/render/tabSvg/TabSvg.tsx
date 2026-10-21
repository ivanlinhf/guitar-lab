import type { SongDocument } from '../../domain/score/types.ts'
import { layoutTab } from './layout.ts'
import './TabSvg.css'

export type TabSvgProps = {
  song: SongDocument
}

export function TabSvg({ song }: TabSvgProps) {
  const layout = layoutTab(song)

  return (
    <svg
      className="tab-svg"
      width={layout.width}
      height={layout.height}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-label={`${song.title} tablature`}
    >
      {layout.strings.map((line) => (
        <line
          key={`s${line.string}`}
          className="tab-svg__string"
          x1={line.x1}
          y1={line.y}
          x2={line.x2}
          y2={line.y}
        />
      ))}
      {layout.bars.map((bar, i) => (
        <line
          key={`b${bar.measureIndex}-${i}`}
          className={
            bar.closing ? 'tab-svg__bar tab-svg__bar--close' : 'tab-svg__bar'
          }
          x1={bar.x}
          y1={bar.y1}
          x2={bar.x}
          y2={bar.y2}
        />
      ))}
      {layout.chords.map((chord) => (
        <text
          key={`c${chord.measureIndex}-${chord.chord}`}
          className="tab-svg__chord"
          x={chord.x}
          y={chord.y}
          textAnchor="start"
          dominantBaseline="central"
        >
          {chord.chord}
        </text>
      ))}
      {layout.notes.map((note, i) => (
        <text
          key={`n${note.measureIndex}-${note.beat}-${note.string}-${i}`}
          className="tab-svg__fret"
          x={note.x}
          y={note.y}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {note.fret}
        </text>
      ))}
    </svg>
  )
}

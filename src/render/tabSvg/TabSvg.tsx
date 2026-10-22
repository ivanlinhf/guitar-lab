import { notesAtPlayhead } from '../../domain/score/notesAtPlayhead.ts'
import type { SongDocument } from '../../domain/score/types.ts'
import { BEAT_WIDTH, PADDING_LEFT, layoutTab, stringY } from './layout.ts'
import './TabSvg.css'

export type TabSvgProps = {
  song: SongDocument
  /** Absolute beat playhead; drives fret highlight and optional playhead line. */
  playheadBeat?: number
}

function noteKey(measureIndex: number, beat: number, string: number): string {
  return `${measureIndex}:${beat}:${string}`
}

export function TabSvg({ song, playheadBeat }: TabSvgProps) {
  const layout = layoutTab(song)

  const highlightedKeys =
    playheadBeat === undefined
      ? null
      : new Set(
          notesAtPlayhead(song, playheadBeat).map((a) =>
            noteKey(a.measureIndex, a.note.beat, a.note.string),
          ),
        )

  const playheadX =
    playheadBeat === undefined
      ? null
      : PADDING_LEFT + playheadBeat * BEAT_WIDTH

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
      {layout.notes.map((note, i) => {
        const key = noteKey(note.measureIndex, note.beat, note.string)
        const highlighted = highlightedKeys?.has(key) ?? false
        return (
          <g key={`n${note.measureIndex}-${note.beat}-${note.string}-${i}`}>
            {highlighted ? (
              <rect
                className="tab-svg__fret-bg"
                x={note.x - 9}
                y={note.y - 10}
                width={18}
                height={20}
                rx={3}
              />
            ) : null}
            <text
              className={
                highlighted
                  ? 'tab-svg__fret tab-svg__fret--active'
                  : 'tab-svg__fret'
              }
              x={note.x}
              y={note.y}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {note.fret}
            </text>
          </g>
        )
      })}
      {playheadX !== null ? (
        <line
          className="tab-svg__playhead"
          x1={playheadX}
          y1={stringY(1)}
          x2={playheadX}
          y2={stringY(6)}
        />
      ) : null}
    </svg>
  )
}

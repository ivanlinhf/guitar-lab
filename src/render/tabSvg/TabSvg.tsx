import { notesAtPlayhead } from '../../domain/score/notesAtPlayhead.ts'
import type { SongDocument } from '../../domain/score/types.ts'
import {
  layoutTab,
  playheadGeometry,
} from './layout.ts'
import { useFretSettle } from './useFretSettle.ts'
import './TabSvg.css'

export type TabSvgProps = {
  song: SongDocument
  /** Absolute beat playhead; drives fret highlight and optional playhead line. */
  playheadBeat?: number
  /**
   * Max measures per wrapped row. When omitted, uses the full measure count
   * (single horizontal strip).
   */
  measuresPerRow?: number
}

function noteKey(measureIndex: number, beat: number, string: number): string {
  return `${measureIndex}:${beat}:${string}`
}

function highlightSignature(keys: Set<string> | null): string {
  if (keys === null || keys.size === 0) {
    return ''
  }
  return [...keys].sort().join('|')
}

export function TabSvg({ song, playheadBeat, measuresPerRow }: TabSvgProps) {
  const layout = layoutTab(song, { measuresPerRow })

  const highlightedKeys =
    playheadBeat === undefined
      ? null
      : new Set(
          notesAtPlayhead(song, playheadBeat).map((a) =>
            noteKey(a.measureIndex, a.note.beat, a.note.string),
          ),
        )

  const keysSig = highlightSignature(highlightedKeys)
  const animateSettle = useFretSettle(playheadBeat, keysSig)

  const playhead =
    playheadBeat === undefined
      ? null
      : playheadGeometry(
          playheadBeat,
          layout.beatsPerMeasure,
          layout.measureCount,
          layout.measuresPerRow,
        )

  const fretBgClass = animateSettle
    ? 'tab-svg__fret-bg'
    : 'tab-svg__fret-bg tab-svg__fret-bg--instant'
  const playheadClass = animateSettle
    ? 'tab-svg__playhead'
    : 'tab-svg__playhead tab-svg__playhead--instant'

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
          key={`s${line.row}-${line.string}`}
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
                className={fretBgClass}
                x={note.x - 9}
                y={note.y - 10}
                width={18}
                height={20}
                rx={4}
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
      {playhead !== null ? (
        <line
          key={keysSig || 'playhead'}
          className={playheadClass}
          x1={playhead.x}
          y1={playhead.y1}
          x2={playhead.x}
          y2={playhead.y2}
        />
      ) : null}
    </svg>
  )
}

import type { GuitarString, SongDocument } from '../../domain/score/types.ts'

/** Horizontal pixels per beat. */
export const BEAT_WIDTH = 48

/** Vertical distance between adjacent strings. */
export const STRING_SPACING = 22

/** Left inset before the first bar line / beat. */
export const PADDING_LEFT = 36

/** Right inset after the final bar line. */
export const PADDING_RIGHT = 24

/** Top inset above string 1. */
export const PADDING_TOP = 28

/** Bottom inset below string 6. */
export const PADDING_BOTTOM = 28

/** Vertical gap between wrapped staff rows. */
export const ROW_GAP = 28

/** Vertical position for chord labels above the staff (within a row). */
export const CHORD_LABEL_Y = 14

/** Horizontal nudge past the opening bar so the label sits in the measure. */
export const CHORD_LABEL_X_INSET = 6

/** Height of one staff row (string 1 top through padding below string 6). */
export const STAFF_HEIGHT = PADDING_TOP + 5 * STRING_SPACING + PADDING_BOTTOM

export type LaidOutNote = {
  measureIndex: number
  beat: number
  string: GuitarString
  fret: number
  x: number
  y: number
}

export type LaidOutChord = {
  measureIndex: number
  chord: string
  x: number
  y: number
}

export type StringLine = {
  string: GuitarString
  /** Zero-based wrapped row this string segment belongs to. */
  row: number
  y: number
  x1: number
  x2: number
}

export type BarLine = {
  /** Measure index this bar opens (1-based). Final closing bar uses last measure index. */
  measureIndex: number
  x: number
  y1: number
  y2: number
  /** True for the staff-closing bar after the last measure in a row. */
  closing?: boolean
}

export type TabLayout = {
  width: number
  height: number
  beatsPerMeasure: number
  measureCount: number
  /** How many measures sit on each wrapped row (at least 1). */
  measuresPerRow: number
  rowCount: number
  strings: StringLine[]
  bars: BarLine[]
  notes: LaidOutNote[]
  chords: LaidOutChord[]
}

export type LayoutTabOptions = {
  /**
   * Max measures on a horizontal row before wrapping.
   * Defaults to the full measure count (single strip).
   */
  measuresPerRow?: number
}

/** Pixel width of one measure at the given time signature. */
export function measureWidthPx(beatsPerMeasure: number): number {
  return beatsPerMeasure * BEAT_WIDTH
}

/**
 * How many measures fit in `availableWidth` (score viewport content width).
 * Always at least 1 so a narrow viewport still shows one measure (may clip).
 */
export function measuresPerRowForWidth(
  availableWidth: number,
  beatsPerMeasure: number,
): number {
  const usable = Math.max(0, availableWidth - PADDING_LEFT - PADDING_RIGHT)
  const perMeasure = measureWidthPx(beatsPerMeasure)
  if (perMeasure <= 0) {
    return 1
  }
  return Math.max(1, Math.floor(usable / perMeasure))
}

/** Zero-based row for a zero-based measure index. */
export function rowIndexForMeasure(
  measureIndexZeroBased: number,
  measuresPerRow: number,
): number {
  const mpr = Math.max(1, Math.trunc(measuresPerRow))
  return Math.floor(Math.max(0, measureIndexZeroBased) / mpr)
}

/**
 * Zero-based row containing `playheadBeat`.
 * At exact song-end beat equal to `measureCount * beatsPerMeasure`, uses the
 * last measure's row (same clamp idea as measure indexing).
 */
export function rowIndexFromPlayhead(
  playheadBeat: number,
  beatsPerMeasure: number,
  measureCount: number,
  measuresPerRow: number,
): number {
  const bpm = Math.max(1, beatsPerMeasure)
  const count = Math.max(0, measureCount)
  if (count === 0) {
    return 0
  }
  const raw = Math.floor(playheadBeat / bpm)
  const measureZero = Math.min(Math.max(0, raw), count - 1)
  return rowIndexForMeasure(measureZero, measuresPerRow)
}

/** Y of the top of a wrapped row (before that row's `PADDING_TOP`). */
export function rowTopY(rowIndex: number): number {
  return rowIndex * (STAFF_HEIGHT + ROW_GAP)
}

/** Y of string 1 (high E) at top through string 6 at bottom, within a row. */
export function stringY(string: GuitarString, rowIndex = 0): number {
  return rowTopY(rowIndex) + PADDING_TOP + (string - 1) * STRING_SPACING
}

/** Desired `scrollTop` so the playhead row stays inside the viewport. */
export function scrollTopForPlayheadRow(
  rowIndex: number,
  viewportHeight: number,
  currentScrollTop: number,
): number {
  const top = rowTopY(rowIndex)
  const bottom = top + STAFF_HEIGHT
  const viewTop = currentScrollTop
  const viewBottom = currentScrollTop + viewportHeight
  if (top < viewTop) {
    return Math.max(0, top)
  }
  if (bottom > viewBottom) {
    return Math.max(0, bottom - viewportHeight)
  }
  return currentScrollTop
}

function columnInRow(
  measureIndexZeroBased: number,
  measuresPerRow: number,
): number {
  return measureIndexZeroBased % Math.max(1, measuresPerRow)
}

function measureStartXInRow(
  column: number,
  beatsPerMeasure: number,
): number {
  return PADDING_LEFT + column * beatsPerMeasure * BEAT_WIDTH
}

export type PlayheadGeometry = {
  x: number
  y1: number
  y2: number
  row: number
}

/** Absolute SVG playhead line for a wrapped (or single-row) layout. */
export function playheadGeometry(
  playheadBeat: number,
  beatsPerMeasure: number,
  measureCount: number,
  measuresPerRow: number,
): PlayheadGeometry {
  const bpm = Math.max(1, beatsPerMeasure)
  const mpr = Math.max(1, Math.trunc(measuresPerRow))
  const count = Math.max(0, measureCount)
  const row = rowIndexFromPlayhead(playheadBeat, bpm, count, mpr)
  const measureZero =
    count === 0 ? 0 : Math.min(Math.floor(playheadBeat / bpm), count - 1)
  const column = columnInRow(measureZero, mpr)
  const beatInMeasure = playheadBeat - measureZero * bpm
  const x = measureStartXInRow(column, bpm) + beatInMeasure * BEAT_WIDTH
  return {
    x,
    y1: stringY(1, row),
    y2: stringY(6, row),
    row,
  }
}

/**
 * Pure layout for a song: string/bar geometry and note fret positions.
 * Rests advance measure spacing via the time signature but emit no digits.
 * When `measuresPerRow` is less than the measure count, staves wrap into rows.
 */
export function layoutTab(
  song: SongDocument,
  options: LayoutTabOptions = {},
): TabLayout {
  const beatsPerMeasure = song.timeSignature.numerator
  const measureCount = song.measures.length
  const measuresPerRow = Math.max(
    1,
    Math.min(
      measureCount > 0 ? measureCount : 1,
      options.measuresPerRow ?? (measureCount > 0 ? measureCount : 1),
    ),
  )
  const rowCount =
    measureCount === 0 ? 0 : Math.ceil(measureCount / measuresPerRow)
  const measuresOnWidestRow = Math.min(measureCount, measuresPerRow)
  const staffWidth = measuresOnWidestRow * beatsPerMeasure * BEAT_WIDTH
  const width = PADDING_LEFT + staffWidth + PADDING_RIGHT
  const height =
    rowCount === 0
      ? STAFF_HEIGHT
      : rowCount * STAFF_HEIGHT + (rowCount - 1) * ROW_GAP

  const strings: StringLine[] = []
  const bars: BarLine[] = []

  for (let row = 0; row < rowCount; row++) {
    const rowStart = row * measuresPerRow
    const rowEnd = Math.min(measureCount, rowStart + measuresPerRow)
    const measuresInRow = rowEnd - rowStart
    const xStaffEnd =
      PADDING_LEFT + measuresInRow * beatsPerMeasure * BEAT_WIDTH
    const y1 = stringY(1, row)
    const y2 = stringY(6, row)

    for (const s of [1, 2, 3, 4, 5, 6] as const) {
      strings.push({
        string: s,
        row,
        y: stringY(s, row),
        x1: PADDING_LEFT,
        x2: xStaffEnd,
      })
    }

    for (let i = rowStart; i < rowEnd; i++) {
      const measure = song.measures[i]!
      const column = columnInRow(i, measuresPerRow)
      bars.push({
        measureIndex: measure.index,
        x: measureStartXInRow(column, beatsPerMeasure),
        y1,
        y2,
      })
    }
    if (measuresInRow > 0) {
      bars.push({
        measureIndex: song.measures[rowEnd - 1]!.index,
        x: xStaffEnd,
        y1,
        y2,
        closing: true,
      })
    }
  }

  const notes: LaidOutNote[] = []
  const chords: LaidOutChord[] = []
  for (let i = 0; i < measureCount; i++) {
    const measure = song.measures[i]!
    const row = rowIndexForMeasure(i, measuresPerRow)
    const column = columnInRow(i, measuresPerRow)
    const baseX = measureStartXInRow(column, beatsPerMeasure)
    if (measure.chord) {
      chords.push({
        measureIndex: measure.index,
        chord: measure.chord,
        x: baseX + CHORD_LABEL_X_INSET,
        y: rowTopY(row) + CHORD_LABEL_Y,
      })
    }
    for (const event of measure.events) {
      if (event.type !== 'note') continue
      notes.push({
        measureIndex: measure.index,
        beat: event.beat,
        string: event.string,
        fret: event.fret,
        x: baseX + event.beat * BEAT_WIDTH,
        y: stringY(event.string, row),
      })
    }
  }

  return {
    width,
    height,
    beatsPerMeasure,
    measureCount,
    measuresPerRow,
    rowCount,
    strings,
    bars,
    notes,
    chords,
  }
}

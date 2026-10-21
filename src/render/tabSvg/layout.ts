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

/** Vertical position for chord labels above the staff. */
export const CHORD_LABEL_Y = 14

/** Horizontal nudge past the opening bar so the label sits in the measure. */
export const CHORD_LABEL_X_INSET = 6

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
  /** True for the staff-closing bar after the last measure. */
  closing?: boolean
}

export type TabLayout = {
  width: number
  height: number
  beatsPerMeasure: number
  measureCount: number
  strings: StringLine[]
  bars: BarLine[]
  notes: LaidOutNote[]
  chords: LaidOutChord[]
}

/** Y of string 1 (high E) at top through string 6 at bottom. */
export function stringY(string: GuitarString): number {
  return PADDING_TOP + (string - 1) * STRING_SPACING
}

function measureStartX(measureIndexZeroBased: number, beatsPerMeasure: number): number {
  return PADDING_LEFT + measureIndexZeroBased * beatsPerMeasure * BEAT_WIDTH
}

/**
 * Pure layout for a song: string/bar geometry and note fret positions.
 * Rests advance measure spacing via the time signature but emit no digits.
 */
export function layoutTab(song: SongDocument): TabLayout {
  const beatsPerMeasure = song.timeSignature.numerator
  const measureCount = song.measures.length
  const staffWidth = measureCount * beatsPerMeasure * BEAT_WIDTH
  const width = PADDING_LEFT + staffWidth + PADDING_RIGHT
  const y1 = stringY(1)
  const y2 = stringY(6)
  const height = y2 + PADDING_BOTTOM
  const xStaffEnd = PADDING_LEFT + staffWidth

  const strings: StringLine[] = ([1, 2, 3, 4, 5, 6] as const).map((s) => ({
    string: s,
    y: stringY(s),
    x1: PADDING_LEFT,
    x2: xStaffEnd,
  }))

  const bars: BarLine[] = []
  for (let i = 0; i < measureCount; i++) {
    const measure = song.measures[i]!
    bars.push({
      measureIndex: measure.index,
      x: measureStartX(i, beatsPerMeasure),
      y1,
      y2,
    })
  }
  if (measureCount > 0) {
    bars.push({
      measureIndex: song.measures[measureCount - 1]!.index,
      x: xStaffEnd,
      y1,
      y2,
      closing: true,
    })
  }

  const notes: LaidOutNote[] = []
  const chords: LaidOutChord[] = []
  for (let i = 0; i < measureCount; i++) {
    const measure = song.measures[i]!
    const baseX = measureStartX(i, beatsPerMeasure)
    if (measure.chord) {
      chords.push({
        measureIndex: measure.index,
        chord: measure.chord,
        x: baseX + CHORD_LABEL_X_INSET,
        y: CHORD_LABEL_Y,
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
        y: stringY(event.string),
      })
    }
  }

  return {
    width,
    height,
    beatsPerMeasure,
    measureCount,
    strings,
    bars,
    notes,
    chords,
  }
}

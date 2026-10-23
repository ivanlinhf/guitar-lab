import { describe, expect, it } from 'vitest'
import { getSongById } from '../../domain/library/index.ts'
import type { SongDocument } from '../../domain/score/types.ts'
import {
  BEAT_WIDTH,
  CHORD_LABEL_X_INSET,
  CHORD_LABEL_Y,
  PADDING_LEFT,
  PADDING_RIGHT,
  ROW_GAP,
  STAFF_HEIGHT,
  layoutTab,
  measureWidthPx,
  measuresPerRowForWidth,
  playheadGeometry,
  rowIndexForMeasure,
  rowIndexFromPlayhead,
  rowTopY,
  scrollTopForPlayheadRow,
  stringY,
} from './layout.ts'

describe('layoutTab', () => {
  it('lays out open-strings with measure count and note string/fret', () => {
    const song = getSongById('open-strings')
    expect(song).not.toBeNull()
    const layout = layoutTab(song!)

    expect(layout.measureCount).toBe(2)
    expect(layout.beatsPerMeasure).toBe(4)
    expect(layout.measuresPerRow).toBe(2)
    expect(layout.rowCount).toBe(1)
    expect(layout.strings).toHaveLength(6)
    expect(layout.strings[0]!.string).toBe(1)
    expect(layout.strings[0]!.y).toBe(stringY(1))
    expect(layout.strings[5]!.string).toBe(6)
    expect(layout.strings[5]!.y).toBe(stringY(6))
    expect(layout.strings[0]!.y).toBeLessThan(layout.strings[5]!.y)

    // Opening bars for each measure + closing bar
    expect(layout.bars).toHaveLength(3)

    // 6 notes + 2 rests → 6 laid-out notes only
    expect(layout.notes).toHaveLength(6)
    expect(layout.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          measureIndex: 1,
          beat: 0,
          string: 6,
          fret: 0,
        }),
        expect.objectContaining({
          measureIndex: 1,
          beat: 1,
          string: 5,
          fret: 0,
        }),
        expect.objectContaining({
          measureIndex: 2,
          beat: 1,
          string: 1,
          fret: 0,
        }),
      ]),
    )

    // Rests must not produce fret digits
    expect(
      layout.notes.some((n) => n.measureIndex === 1 && n.beat === 3),
    ).toBe(false)
    expect(
      layout.notes.some((n) => n.measureIndex === 2 && n.beat === 2),
    ).toBe(false)

    const first = layout.notes.find(
      (n) => n.measureIndex === 1 && n.beat === 0 && n.string === 6,
    )!
    expect(first.x).toBe(PADDING_LEFT)
    expect(first.y).toBe(stringY(6))
  })

  it('lays out c-am-switch notes with frets and geometry', () => {
    const song = getSongById('c-am-switch')
    expect(song).not.toBeNull()
    const layout = layoutTab(song!)

    expect(layout.measureCount).toBe(2)
    expect(layout.notes).toHaveLength(8)
    expect(layout.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          measureIndex: 1,
          beat: 0,
          string: 5,
          fret: 3,
        }),
        expect.objectContaining({
          measureIndex: 2,
          beat: 0,
          string: 5,
          fret: 0,
        }),
        expect.objectContaining({
          measureIndex: 1,
          beat: 3,
          string: 2,
          fret: 1,
        }),
      ]),
    )

    const secondMeasureNote = layout.notes.find(
      (n) => n.measureIndex === 2 && n.beat === 0,
    )!
    expect(secondMeasureNote.x).toBe(
      PADDING_LEFT + 1 * layout.beatsPerMeasure * BEAT_WIDTH,
    )
  })

  it('includes chord labels above measures that declare chord', () => {
    const open = getSongById('open-strings')!
    const openLayout = layoutTab(open)
    expect(openLayout.chords).toEqual([
      {
        measureIndex: 1,
        chord: 'Em',
        x: PADDING_LEFT + CHORD_LABEL_X_INSET,
        y: CHORD_LABEL_Y,
      },
      {
        measureIndex: 2,
        chord: 'Em',
        x: PADDING_LEFT + 1 * openLayout.beatsPerMeasure * BEAT_WIDTH +
          CHORD_LABEL_X_INSET,
        y: CHORD_LABEL_Y,
      },
    ])

    const cam = getSongById('c-am-switch')!
    const camLayout = layoutTab(cam)
    expect(camLayout.chords).toEqual([
      expect.objectContaining({ measureIndex: 1, chord: 'C' }),
      expect.objectContaining({ measureIndex: 2, chord: 'Am' }),
    ])
    expect(camLayout.chords[0]!.y).toBe(CHORD_LABEL_Y)
    expect(camLayout.chords[0]!.y).toBeLessThan(stringY(1))
  })

  it('lays out eight-bar-drill as a single strip when unconstrained', () => {
    const song = getSongById('eight-bar-drill')
    expect(song).not.toBeNull()
    const layout = layoutTab(song!)

    expect(layout.measureCount).toBe(8)
    expect(layout.beatsPerMeasure).toBe(4)
    expect(layout.measuresPerRow).toBe(8)
    expect(layout.rowCount).toBe(1)
    expect(layout.width).toBe(
      PADDING_LEFT + 8 * 4 * BEAT_WIDTH + PADDING_RIGHT,
    )
    expect(layout.width).toBeGreaterThan(800)
    expect(layout.bars).toHaveLength(9)
    expect(layout.strings).toHaveLength(6)
    expect(layout.chords).toHaveLength(8)
    expect(layout.notes.length).toBeGreaterThan(20)
  })

  it('wraps eight-bar-drill into rows when measuresPerRow is limited', () => {
    const song = getSongById('eight-bar-drill')!
    const layout = layoutTab(song, { measuresPerRow: 4 })

    expect(layout.measuresPerRow).toBe(4)
    expect(layout.rowCount).toBe(2)
    expect(layout.width).toBe(
      PADDING_LEFT + 4 * 4 * BEAT_WIDTH + PADDING_RIGHT,
    )
    expect(layout.height).toBe(2 * STAFF_HEIGHT + ROW_GAP)
    // 4 openings + 1 close per row × 2 rows
    expect(layout.bars).toHaveLength(10)
    expect(layout.strings).toHaveLength(12)

    const m5 = layout.notes.find(
      (n) => n.measureIndex === 5 && n.beat === 0,
    )
    expect(m5).toBeDefined()
    expect(m5!.x).toBe(PADDING_LEFT)
    expect(m5!.y).toBeGreaterThan(stringY(m5!.string, 0))
    expect(m5!.y).toBe(stringY(m5!.string, 1))

    const chord5 = layout.chords.find((c) => c.measureIndex === 5)!
    expect(chord5.y).toBe(rowTopY(1) + CHORD_LABEL_Y)
  })

  it('omits chord labels when measures have no chord', () => {
    const song: SongDocument = {
      formatVersion: 1,
      id: 'no-chords',
      title: 'No Chords',
      tuning: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
      bpm: 80,
      timeSignature: { numerator: 4, denominator: 4 },
      measures: [
        {
          index: 1,
          events: [
            {
              type: 'note',
              beat: 0,
              durationBeats: 4,
              string: 6,
              fret: 0,
            },
          ],
        },
        {
          index: 2,
          events: [
            {
              type: 'rest',
              beat: 0,
              durationBeats: 4,
            },
          ],
        },
      ],
    }

    const layout = layoutTab(song)
    expect(layout.measureCount).toBe(2)
    expect(layout.chords).toEqual([])
  })
})

describe('measuresPerRowForWidth', () => {
  it('fits as many full measures as the viewport allows', () => {
    const beats = 4
    const one = measureWidthPx(beats)
    // Exactly 3 measures of content + padding
    const width = PADDING_LEFT + 3 * one + PADDING_RIGHT
    expect(measuresPerRowForWidth(width, beats)).toBe(3)
  })

  it('returns at least 1 when the viewport is narrower than one measure', () => {
    expect(measuresPerRowForWidth(10, 4)).toBe(1)
  })

  it('ignores a partial trailing measure that does not fit', () => {
    const beats = 4
    const one = measureWidthPx(beats)
    const width = PADDING_LEFT + 2 * one + one / 2 + PADDING_RIGHT
    expect(measuresPerRowForWidth(width, beats)).toBe(2)
  })
})

describe('rowIndexFromPlayhead', () => {
  it('maps playhead beats to wrapped rows', () => {
    // 4 beats/measure, 4 measures/row → measure 0–3 row 0, 4–7 row 1
    expect(rowIndexFromPlayhead(0, 4, 8, 4)).toBe(0)
    expect(rowIndexFromPlayhead(15.9, 4, 8, 4)).toBe(0)
    expect(rowIndexFromPlayhead(16, 4, 8, 4)).toBe(1)
    expect(rowIndexFromPlayhead(31, 4, 8, 4)).toBe(1)
  })

  it('clamps song-end playhead to the last measure row', () => {
    expect(rowIndexFromPlayhead(32, 4, 8, 4)).toBe(1)
    expect(rowIndexForMeasure(7, 4)).toBe(1)
  })
})

describe('scrollTopForPlayheadRow', () => {
  it('scrolls down when the row bottom is below the viewport', () => {
    const viewport = STAFF_HEIGHT
    expect(scrollTopForPlayheadRow(1, viewport, 0)).toBe(
      rowTopY(1) + STAFF_HEIGHT - viewport,
    )
  })

  it('scrolls up when the row top is above the viewport', () => {
    expect(scrollTopForPlayheadRow(0, STAFF_HEIGHT, 200)).toBe(0)
  })

  it('leaves scrollTop unchanged when the row is already visible', () => {
    expect(scrollTopForPlayheadRow(0, 400, 0)).toBe(0)
  })
})

describe('playheadGeometry', () => {
  it('places the playhead on the wrapped row and column', () => {
    const g = playheadGeometry(16.5, 4, 8, 4)
    expect(g.row).toBe(1)
    expect(g.x).toBe(PADDING_LEFT + 0.5 * BEAT_WIDTH)
    expect(g.y1).toBe(stringY(1, 1))
    expect(g.y2).toBe(stringY(6, 1))
  })
})

import { describe, expect, it } from 'vitest'
import { getSongById } from '../../domain/library/index.ts'
import type { SongDocument } from '../../domain/score/types.ts'
import {
  BEAT_WIDTH,
  CHORD_LABEL_X_INSET,
  CHORD_LABEL_Y,
  PADDING_LEFT,
  PADDING_RIGHT,
  layoutTab,
  stringY,
} from './layout.ts'

describe('layoutTab', () => {
  it('lays out open-strings with measure count and note string/fret', () => {
    const song = getSongById('open-strings')
    expect(song).not.toBeNull()
    const layout = layoutTab(song!)

    expect(layout.measureCount).toBe(2)
    expect(layout.beatsPerMeasure).toBe(4)
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

  it('lays out eight-bar-drill wider than a typical viewport', () => {
    const song = getSongById('eight-bar-drill')
    expect(song).not.toBeNull()
    const layout = layoutTab(song!)

    expect(layout.measureCount).toBe(8)
    expect(layout.beatsPerMeasure).toBe(4)
    expect(layout.width).toBe(
      PADDING_LEFT + 8 * 4 * BEAT_WIDTH + PADDING_RIGHT,
    )
    expect(layout.width).toBeGreaterThan(800)
    expect(layout.bars).toHaveLength(9)
    expect(layout.strings).toHaveLength(6)
    expect(layout.chords).toHaveLength(8)
    expect(layout.notes.length).toBeGreaterThan(20)
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

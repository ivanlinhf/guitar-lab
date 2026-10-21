import { describe, expect, it } from 'vitest'
import { getSongById } from '../../domain/library/index.ts'
import {
  BEAT_WIDTH,
  PADDING_LEFT,
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
})

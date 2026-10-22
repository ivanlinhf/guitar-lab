import { describe, expect, it } from 'vitest'
import openStringsJson from '../../songs/open-strings.json'
import { parseSongDocument } from '../../domain/score/schema.ts'
import { songLengthBeats } from '../../domain/score/index.ts'
import { measureIndexFromPlayhead } from './measureIndexFromPlayhead.ts'

const song = parseSongDocument(openStringsJson)

describe('measureIndexFromPlayhead', () => {
  it('maps beat 0 to measure 1', () => {
    expect(measureIndexFromPlayhead(song, 0)).toBe(1)
  })

  it('stays in measure 1 until the next measure starts', () => {
    expect(measureIndexFromPlayhead(song, 3.999)).toBe(1)
    expect(measureIndexFromPlayhead(song, 4)).toBe(2)
  })

  it('clamps at the song end to the last measure', () => {
    expect(measureIndexFromPlayhead(song, songLengthBeats(song))).toBe(2)
    expect(measureIndexFromPlayhead(song, songLengthBeats(song) + 10)).toBe(2)
  })

  it('clamps negative beats to measure 1', () => {
    expect(measureIndexFromPlayhead(song, -1)).toBe(1)
  })
})

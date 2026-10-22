import { afterEach, describe, expect, it, vi } from 'vitest'
import * as audio from '../../audio/index.ts'
import type { ScheduledEvent } from '../../domain/player/index.ts'
import { soundScheduledNote } from './practicePlayback.ts'

vi.mock('../../audio/index.ts', () => ({
  playGuitarNote: vi.fn(() => Promise.resolve()),
}))

afterEach(() => {
  vi.mocked(audio.playGuitarNote).mockClear()
})

describe('soundScheduledNote', () => {
  it('plays a note with duration converted from beats', () => {
    const scheduled: ScheduledEvent = {
      absoluteBeat: 0,
      measureIndex: 1,
      event: {
        type: 'note',
        beat: 0,
        durationBeats: 1,
        string: 6,
        fret: 0,
      },
    }
    // 80 BPM, ratio 1 → 0.75 s per beat
    soundScheduledNote(scheduled, 80, 1)
    expect(audio.playGuitarNote).toHaveBeenCalledTimes(1)
    expect(audio.playGuitarNote).toHaveBeenCalledWith({
      string: 6,
      fret: 0,
      durationSec: 0.75,
    })
  })

  it('respects tempoRatio when converting duration', () => {
    const scheduled: ScheduledEvent = {
      absoluteBeat: 2,
      measureIndex: 1,
      event: {
        type: 'note',
        beat: 2,
        durationBeats: 2,
        string: 1,
        fret: 3,
      },
    }
    // 120 BPM × 0.5 → 60 effective → 1 s/beat; 2 beats → 2 s
    soundScheduledNote(scheduled, 120, 0.5)
    expect(audio.playGuitarNote).toHaveBeenCalledWith({
      string: 1,
      fret: 3,
      durationSec: 2,
    })
  })

  it('ignores rests', () => {
    const scheduled: ScheduledEvent = {
      absoluteBeat: 3,
      measureIndex: 1,
      event: { type: 'rest', beat: 3, durationBeats: 1 },
    }
    soundScheduledNote(scheduled, 80, 1)
    expect(audio.playGuitarNote).not.toHaveBeenCalled()
  })
})

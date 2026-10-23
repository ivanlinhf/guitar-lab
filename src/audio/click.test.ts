import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  CLICK_DURATION_SEC,
  CLICK_FREQUENCY_HZ,
  playClick,
} from './click.ts'
import {
  installFakeAudioContext,
  type InstalledFakeAudio,
} from './fakeAudioContext.ts'
import { closeAudio } from './guitarTone.ts'

describe('click constants', () => {
  it('uses a short audible click', () => {
    expect(CLICK_FREQUENCY_HZ).toBeGreaterThan(0)
    expect(CLICK_DURATION_SEC).toBeGreaterThan(0)
    expect(CLICK_DURATION_SEC).toBeLessThan(0.1)
  })
})

describe('playClick without Web Audio', () => {
  afterEach(async () => {
    await closeAudio()
  })

  it('is an async function', () => {
    expect(typeof playClick).toBe('function')
  })

  it('rejects when Web Audio is unavailable', async () => {
    await expect(playClick()).rejects.toThrow(/Web Audio/)
  })

  it('accepts an optional when (AudioContext time)', async () => {
    await expect(playClick({ when: 0 })).rejects.toThrow(/Web Audio/)
  })
})

describe('playClick with mock AudioContext', () => {
  let fake: InstalledFakeAudio

  beforeEach(() => {
    fake = installFakeAudioContext({ currentTime: 1.5 })
  })

  afterEach(async () => {
    await closeAudio()
    fake.restore()
  })

  it('schedules oscillator connect + start near 1000 Hz', async () => {
    await playClick()

    const ctx = fake.getContext()
    expect(ctx).not.toBeNull()
    expect(ctx!.oscillators).toHaveLength(1)
    expect(ctx!.gains).toHaveLength(1)

    const osc = ctx!.oscillators[0]!
    const gain = ctx!.gains[0]!
    expect(
      osc.frequency.valueAtTimes.some((w) => Math.abs(w.value - 1000) < 0.01),
    ).toBe(true)
    expect(osc.connectedTo).toContain(gain)
    expect(gain.connectedTo).toContain(ctx!.destination)
    expect(osc.startTimes).toEqual([1.5])
  })

  it('uses options.when as the start time when provided', async () => {
    await playClick({ when: 3.25 })

    const osc = fake.getContext()!.oscillators[0]!
    expect(osc.startTimes).toEqual([3.25])
    expect(osc.frequency.valueAtTimes[0]?.time).toBe(3.25)
  })
})

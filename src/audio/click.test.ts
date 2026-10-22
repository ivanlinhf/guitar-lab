import { describe, expect, it } from 'vitest'
import {
  CLICK_DURATION_SEC,
  CLICK_FREQUENCY_HZ,
  playClick,
} from './click.ts'

describe('click constants', () => {
  it('uses a short audible click', () => {
    expect(CLICK_FREQUENCY_HZ).toBeGreaterThan(0)
    expect(CLICK_DURATION_SEC).toBeGreaterThan(0)
    expect(CLICK_DURATION_SEC).toBeLessThan(0.1)
  })
})

describe('playClick', () => {
  it('is an async function', () => {
    expect(typeof playClick).toBe('function')
  })

  it('rejects when Web Audio is unavailable', async () => {
    await expect(playClick()).rejects.toThrow(/Web Audio/)
  })
})

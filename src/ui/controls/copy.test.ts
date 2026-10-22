import { describe, expect, it } from 'vitest'
import { controlBarCopy } from './copy.ts'

describe('controlBarCopy', () => {
  it('matches the practice bottom-bar Chinese table', () => {
    expect(controlBarCopy.play).toBe('播放')
    expect(controlBarCopy.pause).toBe('暂停')
    expect(controlBarCopy.tempo).toBe('速度')
    expect(controlBarCopy.abLoop).toBe('A–B 循环')
    expect(controlBarCopy.setA).toBe('设为 A')
    expect(controlBarCopy.setB).toBe('设为 B')
    expect(controlBarCopy.metronome).toBe('节拍器')
    expect(controlBarCopy.countIn).toBe('预备拍')
    expect(controlBarCopy.on).toBe('开')
    expect(controlBarCopy.off).toBe('关')
    expect(controlBarCopy.measureProgress(3, 8)).toBe('小节 3 / 8')
  })
})

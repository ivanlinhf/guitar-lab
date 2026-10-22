import { describe, expect, it, vi } from 'vitest'
import {
  shouldHandleSpacePlayPause,
  type SpaceKeyTarget,
} from './shouldHandleSpacePlayPause.ts'

function mockTarget(closestResult: unknown): SpaceKeyTarget {
  return {
    closest: vi.fn(() => closestResult),
  }
}

describe('shouldHandleSpacePlayPause', () => {
  it('allows Space when target is null or lacks closest', () => {
    expect(shouldHandleSpacePlayPause(null)).toBe(true)
    expect(shouldHandleSpacePlayPause({})).toBe(true)
  })

  it('allows Space when closest finds no editable ancestor', () => {
    const target = mockTarget(null)
    expect(shouldHandleSpacePlayPause(target)).toBe(true)
    expect(target.closest).toHaveBeenCalledWith(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"])',
    )
  })

  it('rejects Space when closest finds an editable ancestor', () => {
    expect(shouldHandleSpacePlayPause(mockTarget({ tag: 'input' }))).toBe(
      false,
    )
    expect(shouldHandleSpacePlayPause(mockTarget({ tag: 'textarea' }))).toBe(
      false,
    )
    expect(shouldHandleSpacePlayPause(mockTarget({ tag: 'select' }))).toBe(
      false,
    )
    expect(
      shouldHandleSpacePlayPause(mockTarget({ contentEditable: true })),
    ).toBe(false)
  })
})

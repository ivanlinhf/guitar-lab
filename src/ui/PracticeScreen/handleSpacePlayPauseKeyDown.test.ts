import { describe, expect, it, vi } from 'vitest'
import {
  handleSpacePlayPauseKeyDown,
  type SpacePlayPauseKeyEvent,
} from './handleSpacePlayPauseKeyDown.ts'

function spaceEvent(
  overrides: Partial<SpacePlayPauseKeyEvent> = {},
): SpacePlayPauseKeyEvent {
  return {
    code: 'Space',
    repeat: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    target: null,
    preventDefault: vi.fn(),
    ...overrides,
  }
}

describe('handleSpacePlayPauseKeyDown', () => {
  it('toggles play/pause and prevents default for a plain Space', () => {
    const toggle = vi.fn()
    const event = spaceEvent()
    expect(handleSpacePlayPauseKeyDown(event, toggle)).toBe(true)
    expect(event.preventDefault).toHaveBeenCalledTimes(1)
    expect(toggle).toHaveBeenCalledTimes(1)
  })

  it('ignores key repeat', () => {
    const toggle = vi.fn()
    const event = spaceEvent({ repeat: true })
    expect(handleSpacePlayPauseKeyDown(event, toggle)).toBe(false)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(toggle).not.toHaveBeenCalled()
  })

  it('ignores non-Space keys', () => {
    const toggle = vi.fn()
    expect(
      handleSpacePlayPauseKeyDown(spaceEvent({ code: 'KeyA' }), toggle),
    ).toBe(false)
    expect(toggle).not.toHaveBeenCalled()
  })

  it('ignores Space with modifier keys', () => {
    const toggle = vi.fn()
    expect(
      handleSpacePlayPauseKeyDown(spaceEvent({ ctrlKey: true }), toggle),
    ).toBe(false)
    expect(
      handleSpacePlayPauseKeyDown(spaceEvent({ metaKey: true }), toggle),
    ).toBe(false)
    expect(
      handleSpacePlayPauseKeyDown(spaceEvent({ altKey: true }), toggle),
    ).toBe(false)
    expect(toggle).not.toHaveBeenCalled()
  })

  it('ignores Space when focus is an editable target', () => {
    const toggle = vi.fn()
    const event = spaceEvent({
      target: {
        closest: vi.fn(() => ({ tag: 'input' })),
      },
    })
    expect(handleSpacePlayPauseKeyDown(event, toggle)).toBe(false)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(toggle).not.toHaveBeenCalled()
  })
})

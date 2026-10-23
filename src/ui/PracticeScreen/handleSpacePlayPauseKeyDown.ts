import { shouldHandleSpacePlayPause } from './shouldHandleSpacePlayPause.ts'

/**
 * Minimal keydown fields used by the Practice Space → play/pause path.
 * Avoids requiring a full KeyboardEvent / DOM in unit tests.
 */
export type SpacePlayPauseKeyEvent = {
  code: string
  repeat: boolean
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  target: unknown
  preventDefault: () => void
}

/**
 * Handle a Practice-screen Space keydown: toggle play/pause when appropriate.
 * Returns true when the event was handled (default prevented + toggle called).
 */
export function handleSpacePlayPauseKeyDown(
  event: SpacePlayPauseKeyEvent,
  togglePlayPause: () => void,
): boolean {
  if (event.code !== 'Space' || event.repeat) {
    return false
  }
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false
  }
  if (!shouldHandleSpacePlayPause(event.target)) {
    return false
  }
  event.preventDefault()
  togglePlayPause()
  return true
}

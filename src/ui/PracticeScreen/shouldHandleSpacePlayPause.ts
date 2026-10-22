/**
 * Minimal surface needed to detect editable focus without requiring a DOM
 * environment in unit tests (`closest` is Element's standard API).
 */
export type SpaceKeyTarget = {
  closest: (selectors: string) => unknown
}

const EDITABLE_SELECTOR =
  'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

function hasClosest(target: unknown): target is SpaceKeyTarget {
  return (
    typeof target === 'object' &&
    target !== null &&
    typeof (target as SpaceKeyTarget).closest === 'function'
  )
}

/**
 * Whether Space should toggle practice play/pause for this event target.
 * False when focus is in an editable field so typing is not hijacked.
 */
export function shouldHandleSpacePlayPause(target: unknown): boolean {
  if (!hasClosest(target)) {
    return true
  }
  return target.closest(EDITABLE_SELECTOR) === null
}

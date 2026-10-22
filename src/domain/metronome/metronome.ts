/** Fires once per integer absolute beat when the metronome is enabled. */
export type MetronomeClickListener = (absoluteBeat: number) => void

export interface Metronome {
  enabled: boolean
  /**
   * Next integer absolute beat that will click when the playhead reaches it.
   * Updated by {@link syncMetronomePlayhead} and {@link advanceMetronomeTo}.
   */
  nextBeat: number
  readonly clickListeners: Set<MetronomeClickListener>
}

const INTEGER_EPS = 1e-9

/** True when `beat` is within epsilon of an integer. */
export function isIntegerBeat(beat: number): boolean {
  return Math.abs(beat - Math.round(beat)) < INTEGER_EPS
}

/**
 * Next integer beat at or after `playheadBeat`.
 * Sitting exactly on an integer schedules that beat for the next advance
 * (same pattern as the player's schedule cursor after seek).
 */
export function nextIntegerBeatAtOrAfter(playheadBeat: number): number {
  if (isIntegerBeat(playheadBeat)) {
    return Math.round(playheadBeat)
  }
  return Math.ceil(playheadBeat)
}

export function createMetronome(playheadBeat = 0): Metronome {
  return {
    enabled: false,
    nextBeat: nextIntegerBeatAtOrAfter(playheadBeat),
    clickListeners: new Set(),
  }
}

export function isMetronomeEnabled(metronome: Metronome): boolean {
  return metronome.enabled
}

/**
 * Enable or disable the metronome.
 * When enabling, pass `playheadBeat` so missed beats while disabled are not dumped.
 */
export function setMetronomeEnabled(
  metronome: Metronome,
  enabled: boolean,
  playheadBeat?: number,
): Metronome {
  metronome.enabled = enabled
  if (enabled && playheadBeat !== undefined) {
    syncMetronomePlayhead(metronome, playheadBeat)
  }
  return metronome
}

/** After seek / setPlayhead: realign so the next advance neither doubles nor skips. */
export function syncMetronomePlayhead(
  metronome: Metronome,
  playheadBeat: number,
): void {
  metronome.nextBeat = nextIntegerBeatAtOrAfter(playheadBeat)
}

export function onMetronomeClick(
  metronome: Metronome,
  listener: MetronomeClickListener,
): () => void {
  metronome.clickListeners.add(listener)
  return () => {
    metronome.clickListeners.delete(listener)
  }
}

function dispatchClick(metronome: Metronome, absoluteBeat: number): void {
  for (const listener of metronome.clickListeners) {
    listener(absoluteBeat)
  }
}

/**
 * Fire clicks for each integer beat `B` with `nextBeat <= B <= toBeat`.
 * No-op when disabled. Advances `nextBeat` past every fired beat.
 */
export function advanceMetronomeTo(
  metronome: Metronome,
  toBeat: number,
): void {
  if (!metronome.enabled) {
    return
  }
  while (metronome.nextBeat <= toBeat) {
    const beat = metronome.nextBeat
    metronome.nextBeat += 1
    dispatchClick(metronome, beat)
  }
}

/**
 * Fire clicks for integer beats `B` with `nextBeat <= B < beforeBeat`.
 * Used when looping so the exclusive loop-end boundary is not clicked
 * before wrapping (avoids double-click with the loop-start downbeat).
 */
export function advanceMetronomeBefore(
  metronome: Metronome,
  beforeBeat: number,
): void {
  if (!metronome.enabled) {
    return
  }
  while (metronome.nextBeat < beforeBeat) {
    const beat = metronome.nextBeat
    metronome.nextBeat += 1
    dispatchClick(metronome, beat)
  }
}

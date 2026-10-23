/**
 * Minimal Web Audio doubles for Vitest (Node has no AudioContext).
 * Covers the graph used by `playClick` / `playGuitarNote`.
 */

export type FakeAudioParam = {
  setValueAtTime: (value: number, startTime: number) => FakeAudioParam
  linearRampToValueAtTime: (value: number, endTime: number) => FakeAudioParam
  exponentialRampToValueAtTime: (
    value: number,
    endTime: number,
  ) => FakeAudioParam
  /** Values written via setValueAtTime (for assertions). */
  valueAtTimes: Array<{ value: number; time: number }>
}

export type FakeOscillatorNode = {
  type: OscillatorType
  frequency: FakeAudioParam
  connect: (destination: unknown) => FakeOscillatorNode
  disconnect: () => void
  start: (when?: number) => void
  stop: (when?: number) => void
  onended: ((this: FakeOscillatorNode, ev: Event) => void) | null
  connectedTo: unknown[]
  startTimes: number[]
  stopTimes: number[]
}

export type FakeGainNode = {
  gain: FakeAudioParam
  connect: (destination: unknown) => FakeGainNode
  disconnect: () => void
  connectedTo: unknown[]
}

export type FakeAudioContext = {
  state: AudioContextState
  currentTime: number
  destination: { __fakeDestination: true }
  createOscillator: () => FakeOscillatorNode
  createGain: () => FakeGainNode
  resume: () => Promise<void>
  close: () => Promise<void>
  oscillators: FakeOscillatorNode[]
  gains: FakeGainNode[]
}

function createFakeAudioParam(): FakeAudioParam {
  const valueAtTimes: Array<{ value: number; time: number }> = []
  const param: FakeAudioParam = {
    valueAtTimes,
    setValueAtTime(value, time) {
      valueAtTimes.push({ value, time })
      return param
    },
    linearRampToValueAtTime() {
      return param
    },
    exponentialRampToValueAtTime() {
      return param
    },
  }
  return param
}

function createFakeOscillator(): FakeOscillatorNode {
  const connectedTo: unknown[] = []
  const startTimes: number[] = []
  const stopTimes: number[] = []
  const osc: FakeOscillatorNode = {
    type: 'sine',
    frequency: createFakeAudioParam(),
    connectedTo,
    startTimes,
    stopTimes,
    onended: null,
    connect(destination) {
      connectedTo.push(destination)
      return osc
    },
    disconnect() {
      connectedTo.length = 0
    },
    start(when = 0) {
      startTimes.push(when)
    },
    stop(when = 0) {
      stopTimes.push(when)
    },
  }
  return osc
}

function createFakeGain(): FakeGainNode {
  const connectedTo: unknown[] = []
  const gain: FakeGainNode = {
    gain: createFakeAudioParam(),
    connectedTo,
    connect(destination) {
      connectedTo.push(destination)
      return gain
    },
    disconnect() {
      connectedTo.length = 0
    },
  }
  return gain
}

export type CreateFakeAudioContextOptions = {
  currentTime?: number
  state?: AudioContextState
}

/** Build one fake context instance (not installed on globalThis). */
export function createFakeAudioContext(
  options: CreateFakeAudioContextOptions = {},
): FakeAudioContext {
  const oscillators: FakeOscillatorNode[] = []
  const gains: FakeGainNode[] = []
  const destination = { __fakeDestination: true as const }

  const ctx: FakeAudioContext = {
    state: options.state ?? 'running',
    currentTime: options.currentTime ?? 0,
    destination,
    oscillators,
    gains,
    createOscillator() {
      const osc = createFakeOscillator()
      oscillators.push(osc)
      return osc
    },
    createGain() {
      const gain = createFakeGain()
      gains.push(gain)
      return gain
    },
    async resume() {
      if (ctx.state === 'closed') {
        return
      }
      ctx.state = 'running'
    },
    async close() {
      ctx.state = 'closed'
    },
  }
  return ctx
}

/** Mutable bag for swapping AudioContext on globalThis in tests. */
type AudioContextSlot = {
  AudioContext?: unknown
  webkitAudioContext?: unknown
}

export type InstalledFakeAudio = {
  /** Most recently constructed fake context (null before first `new`). */
  getContext: () => FakeAudioContext | null
  /** All contexts constructed while installed. */
  contexts: FakeAudioContext[]
  restore: () => void
}

/**
 * Install a fake `AudioContext` constructor on `globalThis`.
 * Call `restore()` in afterEach / afterAll.
 */
export function installFakeAudioContext(
  options: CreateFakeAudioContextOptions = {},
): InstalledFakeAudio {
  const globals = globalThis as typeof globalThis & AudioContextSlot
  const previousAudioContext = globals.AudioContext
  const previousWebkit = globals.webkitAudioContext
  const contexts: FakeAudioContext[] = []

  // Returning an object from a constructor replaces `this`.
  function FakeAudioContextCtor(): FakeAudioContext {
    const ctx = createFakeAudioContext(options)
    contexts.push(ctx)
    return ctx
  }

  const slot = globals as AudioContextSlot
  slot.AudioContext = FakeAudioContextCtor
  slot.webkitAudioContext = undefined

  return {
    contexts,
    getContext: () => contexts[contexts.length - 1] ?? null,
    restore() {
      slot.AudioContext = previousAudioContext
      slot.webkitAudioContext = previousWebkit
    },
  }
}

import { useState } from 'react'
import { shouldAnimateFretSettle } from './shouldAnimateFretSettle.ts'

type FretSettleState = {
  prevBeat: number | undefined
  prevKeys: string
  settle: boolean
}

const INITIAL: FretSettleState = {
  prevBeat: undefined,
  prevKeys: '',
  settle: false,
}

/**
 * Whether newly mounted fret / playhead highlights should run settle motion.
 * Updates during render from playhead + highlight identity (no layout effects).
 */
export function useFretSettle(
  playheadBeat: number | undefined,
  keysSig: string,
): boolean {
  const [state, setState] = useState<FretSettleState>(INITIAL)

  if (playheadBeat === undefined) {
    if (
      state.prevBeat !== undefined ||
      state.prevKeys !== '' ||
      state.settle
    ) {
      setState(INITIAL)
    }
    return false
  }

  if (keysSig !== state.prevKeys) {
    const settle = shouldAnimateFretSettle(state.prevBeat, playheadBeat)
    setState({
      prevBeat: playheadBeat,
      prevKeys: keysSig,
      settle,
    })
    return settle
  }

  if (playheadBeat !== state.prevBeat) {
    setState({ ...state, prevBeat: playheadBeat })
  }

  return state.settle
}

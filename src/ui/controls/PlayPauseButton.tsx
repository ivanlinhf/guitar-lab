import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '../motion/usePrefersReducedMotion.ts'
import { controlBarCopy } from './copy.ts'

const PLAY_PRESS_MS = 60

export type PlayPauseButtonProps = {
  isPlaying: boolean
  onPlayPause?: () => void
}

/**
 * Primary 播放/暂停 control: micro press then label crossfade on state change.
 */
export function PlayPauseButton({
  isPlaying,
  onPlayPause,
}: PlayPauseButtonProps) {
  const playEnabled = onPlayPause !== undefined
  const reducedMotion = usePrefersReducedMotion()
  const [labelPlaying, setLabelPlaying] = useState(isPlaying)
  const [pressing, setPressing] = useState(false)

  useEffect(() => {
    if (!playEnabled || isPlaying === labelPlaying) {
      return
    }

    if (reducedMotion) {
      const id = window.setTimeout(() => {
        setLabelPlaying(isPlaying)
        setPressing(false)
      }, 0)
      return () => {
        window.clearTimeout(id)
      }
    }

    const pressId = window.setTimeout(() => {
      setPressing(true)
    }, 0)
    const swapId = window.setTimeout(() => {
      setLabelPlaying(isPlaying)
      setPressing(false)
    }, PLAY_PRESS_MS)
    return () => {
      window.clearTimeout(pressId)
      window.clearTimeout(swapId)
    }
  }, [isPlaying, labelPlaying, playEnabled, reducedMotion])

  const className = [
    'control-bar__item',
    playEnabled ? 'control-bar__item--active control-bar__item--primary' : '',
    pressing ? 'control-bar__item--pressing' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={className}
      disabled={!playEnabled}
      onClick={onPlayPause}
      aria-pressed={playEnabled ? isPlaying : undefined}
    >
      {playEnabled ? (
        <span className="control-bar__play-stack">
          <span
            className={
              labelPlaying
                ? 'control-bar__play-label'
                : 'control-bar__play-label is-shown'
            }
          >
            {controlBarCopy.play}
          </span>
          <span
            className={
              labelPlaying
                ? 'control-bar__play-label is-shown'
                : 'control-bar__play-label'
            }
          >
            {controlBarCopy.pause}
          </span>
        </span>
      ) : (
        controlBarCopy.play
      )}
    </button>
  )
}

import './ControlBar.css'

export type ControlBarProps = {
  /** When true, the play button shows「暂停」; otherwise「播放」. */
  isPlaying?: boolean
  /** Wired play/pause handler; when omitted the play button stays disabled. */
  onPlayPause?: () => void
}

/** Fixed practice bottom bar — play/pause is live; other controls are placeholders. */
export function ControlBar({
  isPlaying = false,
  onPlayPause,
}: ControlBarProps) {
  const playEnabled = onPlayPause !== undefined

  return (
    <div className="control-bar" role="toolbar" aria-label="练习控件">
      <button
        type="button"
        className={
          playEnabled
            ? 'control-bar__item control-bar__item--active'
            : 'control-bar__item'
        }
        disabled={!playEnabled}
        onClick={onPlayPause}
        aria-pressed={playEnabled ? isPlaying : undefined}
      >
        {isPlaying ? '暂停' : '播放'}
      </button>
      <button type="button" className="control-bar__item" disabled>
        速度
      </button>
      <button type="button" className="control-bar__item" disabled>
        A–B
      </button>
      <button type="button" className="control-bar__item" disabled>
        节拍器
      </button>
      <button type="button" className="control-bar__item" disabled>
        小节
      </button>
    </div>
  )
}

import './ControlBar.css'

/** Fixed practice bottom bar — layout only; controls are placeholders. */
export function ControlBar() {
  return (
    <div className="control-bar" role="toolbar" aria-label="练习控件">
      <button type="button" className="control-bar__item" disabled>
        播放
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

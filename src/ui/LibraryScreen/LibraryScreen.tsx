import { listSongs } from '../../domain/library/index.ts'
import type { SongListItem } from '../../domain/library/index.ts'
import './LibraryScreen.css'

export type LibraryScreenProps = {
  /** Called when the user starts practice for a song. */
  onStartPractice?: (songId: string) => void
  /** Override the built-in song list (useful in tests). */
  songs?: SongListItem[]
}

function songMetaLine(song: SongListItem): string | null {
  const parts: string[] = [`BPM ${song.bpm}`]
  const description = song.description?.trim()
  if (description) {
    parts.push(description)
  }
  return parts.join(' · ')
}

export function LibraryScreen({
  onStartPractice,
  songs: songsProp,
}: LibraryScreenProps) {
  const songs = songsProp ?? listSongs()

  return (
    <div className="library-screen">
      <header className="library-screen__hero">
        <p className="library-screen__brand">
          Guitar <em className="library-screen__brand-em">Lab</em>
        </p>
      </header>
      <div className="library-screen__body">
        <h1 className="library-screen__title">练习曲库</h1>
        <p className="library-screen__lede">
          选一首短练习曲，进入谱面优先的慢练页。
        </p>
        {songs.length === 0 ? (
          <div className="library-screen__empty" role="status">
            <p className="library-screen__empty-title">暂无练习曲</p>
            <p className="library-screen__empty-hint">
              内置曲目加载后将显示在此处。
            </p>
          </div>
        ) : (
          <ul className="library-screen__list">
            {songs.map((song) => {
              const start = () => onStartPractice?.(song.id)
              const meta = songMetaLine(song)
              return (
                <li key={song.id} className="library-screen__item">
                  <div
                    className="library-screen__row"
                    role="button"
                    tabIndex={0}
                    onClick={start}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        start()
                      }
                    }}
                  >
                    <div className="library-screen__song">
                      <span className="library-screen__song-title">
                        {song.title}
                      </span>
                      {meta ? (
                        <span className="library-screen__song-meta">{meta}</span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="library-screen__start"
                      onClick={(e) => {
                        e.stopPropagation()
                        start()
                      }}
                    >
                      开始练习
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

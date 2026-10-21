import { listSongs } from '../../domain/library/index.ts'
import './LibraryScreen.css'

export type LibraryScreenProps = {
  /** Called when the user starts practice for a song. */
  onStartPractice?: (songId: string) => void
}

export function LibraryScreen({ onStartPractice }: LibraryScreenProps) {
  const songs = listSongs()

  return (
    <div className="library-screen">
      <h1 className="library-screen__title">练习曲库</h1>
      <ul className="library-screen__list">
        {songs.map((song) => {
          const start = () => onStartPractice?.(song.id)
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
                <span className="library-screen__song-title">{song.title}</span>
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
    </div>
  )
}

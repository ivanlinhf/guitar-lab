import { getSongById } from '../../domain/library/index.ts'
import './PracticeScreen.css'

export type PracticeScreenProps = {
  songId: string
  onBack: () => void
}

export function PracticeScreen({ songId, onBack }: PracticeScreenProps) {
  const song = getSongById(songId)

  return (
    <div className="practice-screen">
      <button type="button" className="practice-screen__back" onClick={onBack}>
        返回
      </button>
      {song ? (
        <h1 className="practice-screen__title">{song.title}</h1>
      ) : (
        <>
          <h1 className="practice-screen__title">{songId}</h1>
          <p className="practice-screen__missing">未找到该曲目</p>
        </>
      )}
    </div>
  )
}

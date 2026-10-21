import { useState } from 'react'
import { LibraryScreen } from './ui/LibraryScreen/index.ts'
import { PracticeScreen } from './ui/PracticeScreen/index.ts'
import './App.css'

type AppView = 'library' | { kind: 'practice'; songId: string }

function App() {
  const [view, setView] = useState<AppView>('library')

  return (
    <main className="app">
      {view === 'library' ? (
        <LibraryScreen
          onStartPractice={(songId) => setView({ kind: 'practice', songId })}
        />
      ) : (
        <PracticeScreen
          songId={view.songId}
          onBack={() => setView('library')}
        />
      )}
    </main>
  )
}

export default App

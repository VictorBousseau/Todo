import { useState } from 'react'

// Barre de titre draggable + contrôles fenêtre
export default function TitleBar({ modeCompact, onToggleCompact, onOpenSettings }) {
  const [survol, setSurvol] = useState(false)

  return (
    <div
      className="title-bar"
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
    >
      {/* Zone de drag — remplit la barre sauf les boutons */}
      <div className="title-bar__drag">
        <span className="title-bar__icon">✓</span>
        <span className="title-bar__label">Todo</span>
      </div>

      <div className={`title-bar__actions ${survol ? 'visible' : ''}`}>
        <button
          className="title-bar__btn"
          title={modeCompact ? 'Mode étendu' : 'Mode compact'}
          onClick={onToggleCompact}
        >
          {modeCompact ? '⊞' : '⊟'}
        </button>
        <button
          className="title-bar__btn"
          title="Paramètres"
          onClick={onOpenSettings}
        >
          ⚙
        </button>
        <button
          className="title-bar__btn"
          title="Réduire dans la barre des tâches"
          onClick={() => window.electronAPI.minimiserFenetre()}
        >
          −
        </button>
        <button
          className="title-bar__btn title-bar__btn--close"
          title="Masquer dans le tray (Ctrl+Alt+T pour réafficher)"
          onClick={() => window.electronAPI.masquerFenetre()}
        >
          ×
        </button>
      </div>
    </div>
  )
}

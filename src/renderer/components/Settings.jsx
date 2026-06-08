import { useState, useEffect } from 'react'

export default function Settings({ onFermer }) {
  const [params, setParams] = useState(null)

  useEffect(() => {
    window.electronAPI.getParametres().then(setParams)
  }, [])

  if (!params) return null

  const mettre = async (champ, valeur) => {
    const nouveaux = { ...params, [champ]: valeur }
    setParams(nouveaux)
    await window.electronAPI.modifierParametres({ [champ]: valeur })
  }

  return (
    <div className="settings">
      <div className="settings__header">
        <h2>Paramètres</h2>
        <button className="settings__close" onClick={onFermer}>×</button>
      </div>

      <label className="settings__row">
        <span>Opacité</span>
        <div className="settings__slider-wrap">
          <input
            type="range" min="0.3" max="1" step="0.05"
            value={params.opacite}
            onChange={(e) => mettre('opacite', parseFloat(e.target.value))}
          />
          <span>{Math.round(params.opacite * 100)}%</span>
        </div>
      </label>

      <label className="settings__row">
        <span>Thème</span>
        <select
          value={params.theme}
          onChange={(e) => mettre('theme', e.target.value)}
        >
          <option value="sombre">Sombre</option>
          <option value="clair">Clair</option>
        </select>
      </label>

      <label className="settings__row">
        <span>Rappel par défaut</span>
        <select
          value={params.rappelDefautMinutes ?? ''}
          onChange={(e) => mettre('rappelDefautMinutes', e.target.value === '' ? null : Number(e.target.value))}
        >
          <option value="">Aucun</option>
          <option value="5">5 min avant</option>
          <option value="10">10 min avant</option>
          <option value="15">15 min avant</option>
          <option value="30">30 min avant</option>
          <option value="60">1h avant</option>
        </select>
      </label>

      <label className="settings__row settings__row--toggle">
        <span>Démarrer avec Windows</span>
        <input
          type="checkbox"
          checked={params.demarrerAvecWindows}
          onChange={(e) => mettre('demarrerAvecWindows', e.target.checked)}
        />
      </label>

      <p className="settings__hint">
        Raccourci global : <kbd>Ctrl+Alt+T</kbd>
      </p>
    </div>
  )
}

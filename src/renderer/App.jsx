import { useState, useEffect } from 'react'
import TitleBar from './components/TitleBar'
import TaskList from './components/TaskList'
import AddTaskForm from './components/AddTaskForm'
import Settings from './components/Settings'
import { useTasks } from './hooks/useTasks'

export default function App() {
  const { tachesVisibles, tachesAujourdhui, chargement, ajouter, modifier, cocher, supprimer, reordonner, snooze } = useTasks()
  const [afficherFormulaire, setAfficherFormulaire]   = useState(false)
  const [afficherParametres, setAfficherParametres]   = useState(false)
  const [modeCompact, setModeCompact]                  = useState(false)
  const [opacite, setOpacite]                          = useState(0.92)
  const [theme, setTheme]                              = useState('sombre')

  // Charge les paramètres initiaux
  useEffect(() => {
    window.electronAPI.getParametres().then((p) => {
      setOpacite(p.opacite)
      setTheme(p.theme)
      setModeCompact(p.modeCompact)
    })
  }, [])

  // Synchronise l'opacité et le thème au changement de paramètres
  useEffect(() => {
    document.documentElement.style.setProperty('--app-opacite', opacite)
    document.documentElement.setAttribute('data-theme', theme)
  }, [opacite, theme])

  // Écoute les changements de paramètres (modifiés dans Settings)
  useEffect(() => {
    const intervalle = setInterval(async () => {
      const p = await window.electronAPI.getParametres()
      setOpacite(p.opacite)
      setTheme(p.theme)
    }, 2000)
    return () => clearInterval(intervalle)
  }, [])

  const tachesAffichees = modeCompact ? tachesAujourdhui : tachesVisibles

  const handleAjouterTache = async (donnees) => {
    await ajouter(donnees)
    setAfficherFormulaire(false)
  }

  const toggleCompact = () => {
    const nouveau = !modeCompact
    setModeCompact(nouveau)
    window.electronAPI.modifierParametres({ modeCompact: nouveau })
  }

  return (
    <div className="app" style={{ '--app-opacite': opacite }}>
      <TitleBar
        modeCompact={modeCompact}
        onToggleCompact={toggleCompact}
        onOpenSettings={() => setAfficherParametres(true)}
      />

      {afficherParametres ? (
        <Settings onFermer={() => setAfficherParametres(false)} />
      ) : (
        <>
          {modeCompact && (
            <div className="app__mode-badge">Aujourd'hui · {tachesAujourdhui.length}</div>
          )}

          <div className="app__scroll">
            {chargement ? (
              <div className="app__chargement">Chargement…</div>
            ) : (
              <TaskList
                taches={tachesAffichees}
                onCocher={cocher}
                onSupprimer={supprimer}
                onModifier={modifier}
                onSnooze={snooze}
                onReordonner={reordonner}
              />
            )}
          </div>

          {afficherFormulaire ? (
            <AddTaskForm
              onAjouter={handleAjouterTache}
              onAnnuler={() => setAfficherFormulaire(false)}
            />
          ) : (
            <button
              className="app__btn-ajouter"
              onClick={() => setAfficherFormulaire(true)}
            >
              + Nouvelle tâche
            </button>
          )}
        </>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'

export function useTasks() {
  const [taches, setTaches] = useState([])
  const [chargement, setChargement] = useState(true)

  // Chargement initial
  useEffect(() => {
    window.electronAPI.getTaches().then((t) => {
      setTaches(t)
      setChargement(false)
    })
  }, [])

  // Écoute les mises à jour poussées depuis main (notifs snooze, scheduler…)
  useEffect(() => {
    const desabonner = window.electronAPI.onTachesMisesAJour((t) => setTaches(t))
    return desabonner
  }, [])

  const ajouter = useCallback(async (donnees) => {
    const t = await window.electronAPI.ajouterTache(donnees)
    setTaches(t)
  }, [])

  const modifier = useCallback(async (id, modifs) => {
    const t = await window.electronAPI.modifierTache(id, modifs)
    setTaches(t)
  }, [])

  const cocher = useCallback(async (id) => {
    const t = await window.electronAPI.cocherTache(id)
    setTaches(t)
    // Archive automatiquement après 2 s
    setTimeout(async () => {
      const t2 = await window.electronAPI.archiverTache(id)
      setTaches(t2)
    }, 2000)
  }, [])

  const supprimer = useCallback(async (id) => {
    const t = await window.electronAPI.supprimerTache(id)
    setTaches(t)
  }, [])

  const reordonner = useCallback(async (ids) => {
    const t = await window.electronAPI.reordonnerTaches(ids)
    setTaches(t)
  }, [])

  const snooze = useCallback(async (id, minutes) => {
    const t = await window.electronAPI.snoozeTache(id, minutes)
    setTaches(t)
  }, [])

  // Tâches visibles : non archivées, triées par ordre puis par échéance
  const tachesVisibles = taches
    .filter((t) => !t.archive)
    .sort((a, b) => {
      if (a.echeance && b.echeance) return new Date(a.echeance) - new Date(b.echeance)
      if (a.echeance) return -1
      if (b.echeance) return 1
      return a.ordre - b.ordre
    })

  const tachesAujourdhui = tachesVisibles.filter((t) => {
    if (!t.echeance) return false
    const auj = new Date()
    const e = new Date(t.echeance)
    return e.getFullYear() === auj.getFullYear() &&
           e.getMonth() === auj.getMonth() &&
           e.getDate() === auj.getDate()
  })

  return {
    taches,
    tachesVisibles,
    tachesAujourdhui,
    chargement,
    ajouter,
    modifier,
    cocher,
    supprimer,
    reordonner,
    snooze,
  }
}

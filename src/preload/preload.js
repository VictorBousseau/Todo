// Pont sécurisé entre le renderer et le process main
// Seules les méthodes explicitement listées ici sont accessibles depuis React
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Tâches ──────────────────────────────────────────────────────────────
  getTaches:       ()           => ipcRenderer.invoke('taches:recuperer'),
  ajouterTache:    (donnees)    => ipcRenderer.invoke('taches:ajouter', donnees),
  modifierTache:   (id, modifs) => ipcRenderer.invoke('taches:modifier', id, modifs),
  cocherTache:     (id)         => ipcRenderer.invoke('taches:cocher', id),
  archiverTache:   (id)         => ipcRenderer.invoke('taches:archiver', id),
  supprimerTache:  (id)         => ipcRenderer.invoke('taches:supprimer', id),
  reordonnerTaches:(ids)        => ipcRenderer.invoke('taches:reordonner', ids),
  snoozeTache:     (id, min)    => ipcRenderer.invoke('taches:snooze', id, min),

  // ── Paramètres ──────────────────────────────────────────────────────────
  getParametres:      ()       => ipcRenderer.invoke('parametres:recuperer'),
  modifierParametres: (modifs) => ipcRenderer.invoke('parametres:modifier', modifs),

  // ── Fenêtre ──────────────────────────────────────────────────────────────
  masquerFenetre:  () => ipcRenderer.send('fenetre:masquer'),
  minimiserFenetre:() => ipcRenderer.send('fenetre:minimiser'),
  quitterApp:      () => ipcRenderer.send('app:quitter'),

  // ── Événements poussés depuis main → renderer ────────────────────────────
  onTachesMisesAJour: (cb) => {
    const handler = (_, taches) => cb(taches)
    ipcRenderer.on('taches:mises-a-jour', handler)
    // Retourne une fonction de désabonnement
    return () => ipcRenderer.removeListener('taches:mises-a-jour', handler)
  },
})

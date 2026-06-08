// Gestionnaires IPC — relient le renderer au process main via contextBridge
const { ipcMain } = require('electron')
const { v4: uuidv4 } = require('uuid')
const store = require('./store')
const { initialiserScheduler, planifierTache } = require('./scheduler')

function enregistrerHandlers() {
  // ── Lecture ──────────────────────────────────────────────────────────────

  ipcMain.handle('taches:recuperer', () => {
    return store.get('taches')
  })

  ipcMain.handle('parametres:recuperer', () => {
    return store.get('parametres')
  })

  // ── Écriture tâches ───────────────────────────────────────────────────────

  ipcMain.handle('taches:ajouter', (_, donnees) => {
    const taches = store.get('taches')
    const nouvelleTache = {
      id:            uuidv4(),
      titre:         donnees.titre.trim(),
      description:   donnees.description || '',
      echeance:      donnees.echeance || null,
      rappelMinutes: donnees.rappelMinutes ?? store.get('parametres.rappelDefautMinutes'),
      termine:       false,
      archive:       false,
      ordre:         taches.length,
      creeA:         new Date().toISOString(),
      notifEnvoyee:  false,
      snoozeJusqua:  null,
    }
    taches.push(nouvelleTache)
    store.set('taches', taches)
    planifierTache(nouvelleTache)
    return taches
  })

  ipcMain.handle('taches:modifier', (_, id, modifications) => {
    const taches = store.get('taches')
    const idx = taches.findIndex(t => t.id === id)
    if (idx === -1) return taches

    // Si l'échéance change, réinitialise la notif
    if (modifications.echeance !== undefined && modifications.echeance !== taches[idx].echeance) {
      modifications.notifEnvoyee = false
      modifications.snoozeJusqua = null
    }

    taches[idx] = { ...taches[idx], ...modifications }
    store.set('taches', taches)
    planifierTache(taches[idx])
    return taches
  })

  ipcMain.handle('taches:cocher', (_, id) => {
    const taches = store.get('taches')
    const idx = taches.findIndex(t => t.id === id)
    if (idx === -1) return taches

    taches[idx].termine = !taches[idx].termine
    // Archive automatiquement après 5 s (géré côté renderer via setTimeout)
    store.set('taches', taches)
    return taches
  })

  ipcMain.handle('taches:archiver', (_, id) => {
    const taches = store.get('taches')
    const idx = taches.findIndex(t => t.id === id)
    if (idx !== -1) {
      taches[idx].archive = true
      store.set('taches', taches)
    }
    return taches
  })

  ipcMain.handle('taches:supprimer', (_, id) => {
    let taches = store.get('taches')
    taches = taches.filter(t => t.id !== id)
    store.set('taches', taches)
    return taches
  })

  ipcMain.handle('taches:reordonner', (_, ids) => {
    const taches = store.get('taches')
    ids.forEach((id, index) => {
      const t = taches.find(t => t.id === id)
      if (t) t.ordre = index
    })
    taches.sort((a, b) => a.ordre - b.ordre)
    store.set('taches', taches)
    return taches
  })

  ipcMain.handle('taches:snooze', (_, id, minutes) => {
    const { snoozeTache } = require('./scheduler')
    snoozeTache(id, minutes)
    return store.get('taches')
  })

  // ── Paramètres ────────────────────────────────────────────────────────────

  ipcMain.handle('parametres:modifier', (event, modifications) => {
    const parametres = store.get('parametres')
    const nouveaux = { ...parametres, ...modifications }
    store.set('parametres', nouveaux)

    // Auto-launch Windows
    if ('demarrerAvecWindows' in modifications) {
      const { app } = require('electron')
      app.setLoginItemSettings({ openAtLogin: modifications.demarrerAvecWindows })
    }

    return nouveaux
  })

  // ── Fenêtre ───────────────────────────────────────────────────────────────

  ipcMain.on('fenetre:masquer', (event) => {
    const win = event.sender.getOwnerBrowserWindow()
    if (win) win.hide()
  })

  ipcMain.on('fenetre:minimiser', (event) => {
    const win = event.sender.getOwnerBrowserWindow()
    if (!win) return
    win.minimize()
    // Réapplique alwaysOnTop à la restauration (Windows peut le perdre après minimize)
    win.once('restore', () => {
      win.setAlwaysOnTop(true, 'screen-saver')
      win.focus()
    })
  })

  ipcMain.on('app:quitter', () => {
    const { app } = require('electron')
    app.quit()
  })
}

module.exports = { enregistrerHandlers }

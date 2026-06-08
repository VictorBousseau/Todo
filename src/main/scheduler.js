// Planificateur de rappels — tourne entièrement dans le process main
// Utilise des setTimeout précis + une vérification minutaire de rattrapage

const { Notification, BrowserWindow } = require('electron')
const store = require('./store')

// Map id → setTimeout handle pour pouvoir annuler
const timers = new Map()

/**
 * Planifie (ou replanifie) les rappels pour toutes les tâches actives.
 * À appeler au démarrage et après chaque modification de tâche.
 */
function initialiserScheduler() {
  // Annule tous les timers existants
  for (const handle of timers.values()) clearTimeout(handle)
  timers.clear()

  const maintenant = Date.now()
  const taches = store.get('taches')

  for (const tache of taches) {
    if (tache.termine || tache.archive || !tache.echeance) continue
    planifierTache(tache, maintenant)
  }

  // Vérifie aussi les rappels manqués (app était fermée)
  verifierRappelsManques(taches, maintenant)
}

/**
 * Planifie le timer pour une tâche donnée.
 * Gère le rappel anticipé (rappelMinutes) ET le snooze.
 */
function planifierTache(tache, maintenant = Date.now()) {
  // Annule l'éventuel timer précédent pour cette tâche
  if (timers.has(tache.id)) {
    clearTimeout(timers.get(tache.id))
    timers.delete(tache.id)
  }

  const heureEcheance = new Date(tache.echeance).getTime()

  // Calcule l'heure de déclenchement : anticipé ou exacte
  let heureDeclenchement
  if (tache.snoozeJusqua) {
    heureDeclenchement = new Date(tache.snoozeJusqua).getTime()
  } else if (tache.rappelMinutes && !tache.notifEnvoyee) {
    heureDeclenchement = heureEcheance - tache.rappelMinutes * 60_000
  } else if (!tache.notifEnvoyee) {
    heureDeclenchement = heureEcheance
  } else {
    return // notif déjà envoyée, rien à faire
  }

  const delai = heureDeclenchement - maintenant

  // Ignore les déclenchements trop dans le futur (> 24h) — ils seront
  // replanifiés au prochain lancement de l'app pour éviter les dérives
  if (delai > 24 * 60 * 60_000) return

  if (delai <= 0) {
    // Déjà passé → notif immédiate si pertinent (< 1h de retard)
    if (maintenant - heureDeclenchement < 60 * 60_000) {
      envoyerNotification(tache)
    }
    return
  }

  const handle = setTimeout(() => {
    // Re-lit depuis le store pour avoir les données fraîches
    const taches = store.get('taches')
    const tacheFraiche = taches.find(t => t.id === tache.id)
    if (!tacheFraiche || tacheFraiche.termine || tacheFraiche.archive) return
    envoyerNotification(tacheFraiche)
  }, delai)

  timers.set(tache.id, handle)
}

/**
 * Envoie la notification système et marque la tâche.
 */
function envoyerNotification(tache) {
  if (!Notification.isSupported()) return

  const echeanceStr = tache.echeance
    ? new Date(tache.echeance).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : ''

  const notif = new Notification({
    title: `⏰ ${tache.titre}`,
    body: echeanceStr ? `Échéance : ${echeanceStr}` : 'Rappel de tâche',
    urgency: 'critical',
    timeoutType: 'never',
    actions: [{ type: 'button', text: 'Snooze 10 min' }],
  })

  notif.on('click', () => {
    // Ramène l'overlay au premier plan
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      win.setAlwaysOnTop(true, 'screen-saver')
      win.show()
      win.focus()
    }
  })

  notif.on('action', (_, index) => {
    if (index === 0) snoozeTache(tache.id, 10)
  })

  notif.show()

  // Marque la tâche comme notifiée (snooze est séparé)
  const taches = store.get('taches')
  const idx = taches.findIndex(t => t.id === tache.id)
  if (idx !== -1) {
    taches[idx].notifEnvoyee = true
    taches[idx].snoozeJusqua = null
    store.set('taches', taches)
    // Informe le renderer
    const win = BrowserWindow.getAllWindows()[0]
    if (win) win.webContents.send('taches:mises-a-jour', taches)
  }
}

/**
 * Reporte une tâche de `minutes` minutes et replanifie.
 */
function snoozeTache(id, minutes) {
  const taches = store.get('taches')
  const idx = taches.findIndex(t => t.id === id)
  if (idx === -1) return

  const snoozeJusqua = new Date(Date.now() + minutes * 60_000).toISOString()
  taches[idx].snoozeJusqua = snoozeJusqua
  taches[idx].notifEnvoyee = false
  store.set('taches', taches)

  planifierTache(taches[idx])

  const win = BrowserWindow.getAllWindows()[0]
  if (win) win.webContents.send('taches:mises-a-jour', taches)
}

/**
 * Vérifie au démarrage les rappels manqués (app était fermée).
 * Notifie immédiatement si l'échéance est dans la dernière heure.
 */
function verifierRappelsManques(taches, maintenant) {
  for (const tache of taches) {
    if (tache.termine || tache.archive || !tache.echeance || tache.notifEnvoyee) continue

    const heureEcheance = new Date(tache.echeance).getTime()
    const retard = maintenant - heureEcheance

    // Manqué depuis moins de 1h → notif de rattrapage
    if (retard > 0 && retard < 60 * 60_000) {
      setTimeout(() => envoyerNotification(tache), 3000) // légère pause au démarrage
    }
  }
}

module.exports = { initialiserScheduler, planifierTache, snoozeTache }

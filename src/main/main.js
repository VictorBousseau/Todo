// Process principal Electron — crée la fenêtre overlay et orchestre les modules
const { app, BrowserWindow, globalShortcut, screen } = require('electron')
const path = require('path')
const store = require('./store')
const { creerTray } = require('./tray')
const { enregistrerHandlers } = require('./ipc-handlers')
const { initialiserScheduler } = require('./scheduler')

const DEVTOOLS_URL = 'http://localhost:5173'
const isDev = !app.isPackaged

let mainWindow = null

function creerFenetre() {
  const parametres = store.get('parametres')
  const bounds = parametres.windowBounds

  // Position par défaut : coin bas-droit de l'écran principal
  const { width: lW, height: lH } = screen.getPrimaryDisplay().workAreaSize
  const x = bounds.x ?? lW - bounds.width - 20
  const y = bounds.y ?? lH - bounds.height - 20

  mainWindow = new BrowserWindow({
    x,
    y,
    width:          bounds.width,
    height:         bounds.height,
    minWidth:       240,
    minHeight:      200,
    // Overlay : toujours au premier plan, même sur les apps plein-écran
    alwaysOnTop:    true,
    alwaysOnTopLevel: 'screen-saver',
    // Fenêtre sans cadre natif
    frame:          false,
    transparent:    true,
    resizable:      true,
    skipTaskbar:    false,
    hasShadow:      false,
    webPreferences: {
      preload:           path.join(__dirname, '../preload/preload.js'),
      contextIsolation:  true,   // sécurité : pas d'accès Node direct depuis le renderer
      nodeIntegration:   false,
      sandbox:           false,  // nécessaire pour electron-store dans le preload
    },
  })

  // Niveau alwaysOnTop le plus élevé disponible
  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  // Charge l'app
  if (isDev) {
    mainWindow.loadURL(DEVTOOLS_URL)
    // mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }

  // Mémorise la position et taille à chaque déplacement/redimensionnement
  const sauvegarderBounds = () => {
    if (!mainWindow) return
    const { x, y, width, height } = mainWindow.getBounds()
    const p = store.get('parametres')
    store.set('parametres', { ...p, windowBounds: { x, y, width, height } })
  }
  mainWindow.on('moved',   sauvegarderBounds)
  mainWindow.on('resized', sauvegarderBounds)

  // Alt+F4 / clic rouge → réduit dans le tray plutôt que quitter
  // Le vrai "Quitter" passe par before-quit (tray ou app:quitter)
  mainWindow.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })

  // Restaure la fenêtre quand l'utilisateur clique sur l'icône dans la barre des tâches
  mainWindow.on('restore', () => {
    mainWindow.setAlwaysOnTop(true, 'screen-saver')
    mainWindow.focus()
  })

  return mainWindow
}

app.whenReady().then(() => {
  enregistrerHandlers()

  const fenetre = creerFenetre()
  creerTray(fenetre)
  initialiserScheduler()

  // Raccourci global Ctrl+Alt+T → afficher/masquer l'overlay
  globalShortcut.register('CommandOrControl+Alt+T', () => {
    if (fenetre.isVisible()) {
      fenetre.hide()
    } else {
      fenetre.show()
      fenetre.focus()
    }
  })

  // Auto-launch : applique le paramètre sauvegardé
  const { demarrerAvecWindows } = store.get('parametres')
  app.setLoginItemSettings({ openAtLogin: demarrerAvecWindows })
})

// Sur macOS, re-crée la fenêtre si on clique sur le dock
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) creerFenetre()
})

// before-quit est le seul chemin de sortie réel (tray "Quitter" ou IPC app:quitter)
app.on('before-quit', () => {
  app.isQuiting = true
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// Empêche Electron de quitter quand toutes les fenêtres sont masquées
app.on('window-all-closed', (e) => {
  if (process.platform !== 'darwin') e.preventDefault()
})

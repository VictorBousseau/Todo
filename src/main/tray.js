// Icône system tray avec menu contextuel
const { Tray, Menu, nativeImage, app } = require('electron')
const path = require('path')

let tray = null

function creerTray(fenetre) {
  // Charge l'icône (PNG 16x16 ou 32x32)
  let icone
  try {
    icone = nativeImage.createFromPath(path.join(__dirname, '../../assets/icon.png'))
    icone = icone.resize({ width: 16, height: 16 })
  } catch {
    // Icône vide en fallback
    icone = nativeImage.createEmpty()
  }

  tray = new Tray(icone)
  tray.setToolTip('Todo Overlay')

  const menu = Menu.buildFromTemplate([
    {
      label: 'Afficher / Masquer',
      click: () => {
        if (fenetre.isVisible()) {
          fenetre.hide()
        } else {
          fenetre.show()
          fenetre.focus()
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quitter',
      click: () => app.quit(),
    },
  ])

  tray.setContextMenu(menu)

  // Double-clic sur l'icône tray → affiche la fenêtre
  tray.on('double-click', () => {
    fenetre.show()
    fenetre.focus()
  })

  return tray
}

module.exports = { creerTray }

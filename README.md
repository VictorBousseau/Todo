# Todo Overlay

Une todo list desktop toujours visible au premier plan, en semi-transparence, avec rappels système.

![Electron](https://img.shields.io/badge/Electron-29-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)

---

## Fonctionnalités

- **Overlay permanent** — fenêtre `alwaysOnTop` niveau `screen-saver`, reste au-dessus de tout (y compris les apps plein écran)
- **Semi-transparente** — opacité réglable de 30 % à 100 % via un slider dans les paramètres
- **Draggable & redimensionnable** — position et taille mémorisées entre les sessions
- **Raccourci global `Ctrl+Alt+T`** — affiche/masque l'overlay depuis n'importe quelle app
- **Rappels système** — notification native à l'heure d'échéance, avec snooze (10 min ou 1h)
- **Rappels manqués** — si l'app était fermée, notifie au prochain lancement (jusqu'à 1h de retard)
- **Drag & drop** — réorganise les tâches à la souris
- **Mode compact** — n'affiche que les tâches du jour
- **Thème clair / sombre**
- **Démarrage automatique avec Windows**
- **System tray** — réduit dans la barre de notification, double-clic pour réafficher

---

## Installation de Node.js et npm

Node.js inclut npm. Installe l'un des deux selon ton OS — **Node.js 18+ requis, 20 LTS recommandé**.

---

### Windows

**Option 1 — Installeur officiel (le plus simple)**
1. Va sur [nodejs.org](https://nodejs.org/) et télécharge la version **LTS**
2. Lance le `.msi` → suivre l'assistant (cocher *"Add to PATH"*)
3. Ouvrir un nouveau terminal PowerShell et vérifier :
   ```powershell
   node --version   # v20.x.x
   npm --version    # 10.x.x
   ```

**Option 2 — winget (Windows 11 natif)**
```powershell
winget install OpenJS.NodeJS.LTS
```

**Option 3 — nvm-windows (recommandé si plusieurs projets)**
```powershell
# Télécharge l'installeur depuis :
# https://github.com/coreybutler/nvm-windows/releases
# → nvm-setup.exe
nvm install 20
nvm use 20
```

**Option 4 — Chocolatey**
```powershell
choco install nodejs-lts
```

---

### macOS

**Option 1 — Homebrew (recommandé)**
```bash
# Installer Homebrew si pas déjà fait :
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install node@20
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Option 2 — nvm (recommandé si plusieurs projets)**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Ferme et rouvre le terminal, puis :
nvm install 20
nvm use 20
nvm alias default 20
```

**Option 3 — Installeur officiel**
Télécharger le `.pkg` LTS sur [nodejs.org](https://nodejs.org/)

---

### Linux

**Ubuntu / Debian**
```bash
# Via NodeSource (paquets officiels à jour)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Ou via snap
sudo snap install node --classic --channel=20
```

**Fedora / RHEL / CentOS**
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

**Arch Linux**
```bash
sudo pacman -S nodejs npm
```

**nvm (toutes distributions — recommandé)**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Ajouter au ~/.bashrc ou ~/.zshrc si pas automatique :
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# Nouveau terminal, puis :
nvm install 20
nvm use 20
nvm alias default 20
```

---

### Vérification

```bash
node --version   # doit afficher v20.x.x (ou 18+)
npm --version    # doit afficher 9.x.x ou 10.x.x
```

---

## Lancement du projet

```bash
# 1. Cloner / se placer dans le dossier
cd todo-overlay

# 2. Installer les dépendances (une seule fois)
npm install

# 3. Lancer en développement
npm run dev
# → Ouvre Vite sur localhost:5173 + fenêtre Electron
#   Sur Linux : utilise npm run dev (--no-sandbox déjà inclus)
```

### Build & packaging

```bash
# Compiler le renderer uniquement
npm run build

# Générer l'installeur Windows (.exe)
npm run dist:win
# → release/Todo Overlay Setup.exe
```

---

## Architecture

```
todo-overlay/
├── src/
│   ├── main/
│   │   ├── main.js          # BrowserWindow overlay, raccourci global, tray
│   │   ├── scheduler.js     # Planificateur de rappels (setTimeout + rattrapage)
│   │   ├── store.js         # Persistance JSON locale (electron-store)
│   │   ├── tray.js          # Icône system tray
│   │   └── ipc-handlers.js  # CRUD tâches et paramètres via ipcMain
│   ├── preload/
│   │   └── preload.js       # contextBridge — seul pont main ↔ renderer
│   └── renderer/
│       ├── App.jsx           # Composant racine, gestion thème/opacité
│       ├── components/
│       │   ├── TitleBar.jsx  # Barre draggable, boutons masquer/quitter
│       │   ├── TaskList.jsx  # Liste avec drag & drop (@dnd-kit)
│       │   ├── TaskItem.jsx  # Tâche : cocher, éditer inline, snooze, supprimer
│       │   ├── AddTaskForm.jsx # Formulaire ajout avec date/heure + rappel
│       │   └── Settings.jsx  # Opacité, thème, rappel par défaut, auto-launch
│       ├── hooks/
│       │   └── useTasks.js   # État React + appels IPC
│       └── styles/
│           └── index.css     # Variables CSS par thème, classes utilitaires
├── assets/
│   └── icon.png
├── index.html
├── vite.config.js
└── package.json
```

### Sécurité Electron

- `contextIsolation: true` — le renderer n'a pas accès direct à Node.js
- `nodeIntegration: false` — aucune API Node exposée directement
- Tout passe par `contextBridge` dans `preload.js`

### Scheduler (process main)

Le scheduler tourne entièrement dans le process main pour fiabilité :

1. Au démarrage, recharge toutes les tâches depuis le store et pose des `setTimeout`
2. Chaque tâche peut avoir un rappel anticipé (`rappelMinutes` avant l'échéance)
3. Les rappels > 24h sont différés au prochain lancement (évite les dérives de timer)
4. Au lancement, les tâches manquées depuis < 1h reçoivent une notif immédiate
5. Snooze = nouvelle deadline temporaire (`snoozeJusqua`) + nouveau `setTimeout`

---

## Données

Les tâches et paramètres sont stockés localement dans :

| OS | Chemin |
|---|---|
| Windows | `%APPDATA%\todo-overlay-data\config.json` |
| macOS | `~/Library/Application Support/todo-overlay-data/config.json` |
| Linux | `~/.config/todo-overlay-data/config.json` |

### Modèle de tâche

```json
{
  "id": "uuid-v4",
  "titre": "Appeler le médecin",
  "description": "",
  "echeance": "2024-12-25T09:00:00.000Z",
  "rappelMinutes": 10,
  "termine": false,
  "archive": false,
  "ordre": 0,
  "creeA": "2024-12-24T18:00:00.000Z",
  "notifEnvoyee": false,
  "snoozeJusqua": null
}
```

---

## Raccourcis

| Action | Raccourci |
|---|---|
| Afficher / masquer l'overlay | `Ctrl+Alt+T` (global) |
| Valider l'édition d'une tâche | `Entrée` |
| Annuler l'édition | `Échap` |
| Éditer une tâche | Double-clic sur le titre |

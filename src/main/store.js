// Persistance locale via electron-store (fichier JSON dans AppData)
const Store = require('electron-store')

const schema = {
  taches: {
    type: 'array',
    default: [],
    items: {
      type: 'object',
      properties: {
        id:             { type: 'string' },
        titre:          { type: 'string' },
        description:    { type: 'string' },
        echeance:       { type: ['string', 'null'] },   // ISO 8601 ou null
        rappelMinutes:  { type: ['number', 'null'] },   // minutes avant échéance
        termine:        { type: 'boolean' },
        archive:        { type: 'boolean' },
        ordre:          { type: 'number' },
        creeA:          { type: 'string' },
        notifEnvoyee:   { type: 'boolean' },            // notif principale envoyée
        snoozeJusqua:   { type: ['string', 'null'] },   // ISO snooze ou null
      },
    },
  },
  parametres: {
    type: 'object',
    default: {
      opacite:              0.92,
      theme:                'sombre',
      modeCompact:          false,
      demarrerAvecWindows:  true,
      rappelDefautMinutes:  10,
      windowBounds: { x: null, y: null, width: 320, height: 520 },
    },
  },
}

const store = new Store({ schema, name: 'todo-overlay-data' })

module.exports = store

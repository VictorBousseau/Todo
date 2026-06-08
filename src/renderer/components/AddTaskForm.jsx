import { useState } from 'react'

const OPTIONS_RAPPEL = [
  { label: 'Aucun',   value: null },
  { label: '5 min',   value: 5 },
  { label: '10 min',  value: 10 },
  { label: '15 min',  value: 15 },
  { label: '30 min',  value: 30 },
  { label: '1h',      value: 60 },
]

export default function AddTaskForm({ onAjouter, onAnnuler, tacheInitiale = null }) {
  const [titre, setTitre]         = useState(tacheInitiale?.titre ?? '')
  const [echeance, setEcheance]   = useState(tacheInitiale?.echeance
    ? new Date(tacheInitiale.echeance).toISOString().slice(0, 16) : '')
  const [rappel, setRappel]       = useState(tacheInitiale?.rappelMinutes ?? 10)
  const [description, setDesc]    = useState(tacheInitiale?.description ?? '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!titre.trim()) return
    onAjouter({
      titre,
      description,
      echeance: echeance ? new Date(echeance).toISOString() : null,
      rappelMinutes: rappel,
    })
    setTitre('')
    setEcheance('')
    setDesc('')
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <input
        className="add-form__titre"
        type="text"
        placeholder="Nouvelle tâche…"
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
        autoFocus
        maxLength={120}
      />

      <div className="add-form__row">
        <input
          className="add-form__datetime"
          type="datetime-local"
          value={echeance}
          onChange={(e) => setEcheance(e.target.value)}
          title="Échéance (optionnelle)"
        />

        <select
          className="add-form__rappel"
          value={rappel ?? ''}
          onChange={(e) => setRappel(e.target.value === '' ? null : Number(e.target.value))}
          title="Rappel avant l'échéance"
          disabled={!echeance}
        >
          {OPTIONS_RAPPEL.map((o) => (
            <option key={o.label} value={o.value ?? ''}>{o.label}</option>
          ))}
        </select>
      </div>

      <textarea
        className="add-form__desc"
        placeholder="Description (optionnel)…"
        value={description}
        onChange={(e) => setDesc(e.target.value)}
        rows={2}
        maxLength={500}
      />

      <div className="add-form__actions">
        {onAnnuler && (
          <button type="button" className="btn btn--ghost" onClick={onAnnuler}>Annuler</button>
        )}
        <button type="submit" className="btn btn--primary" disabled={!titre.trim()}>
          {tacheInitiale ? 'Enregistrer' : '+ Ajouter'}
        </button>
      </div>
    </form>
  )
}

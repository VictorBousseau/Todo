import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function formatEcheance(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const auj = new Date()
  const estAujourd = d.toDateString() === auj.toDateString()
  const heure = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (estAujourd) return `Aujourd'hui ${heure}`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' ' + heure
}

function classeEcheance(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const maintenant = new Date()
  if (d < maintenant) return 'echeance--depassee'
  if (d - maintenant < 60 * 60_000) return 'echeance--urgente'
  return ''
}

export default function TaskItem({ tache, onCocher, onSupprimer, onModifier, onSnooze }) {
  const [enEdition, setEnEdition] = useState(false)
  const [titreDraft, setTitreDraft] = useState(tache.titre)
  const [menuOuvert, setMenuOuvert] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tache.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const validerEdition = () => {
    if (titreDraft.trim() && titreDraft !== tache.titre) {
      onModifier(tache.id, { titre: titreDraft.trim() })
    }
    setEnEdition(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-item ${tache.termine ? 'task-item--terminee' : ''}`}
    >
      {/* Poignée de drag */}
      <span className="task-item__drag" {...attributes} {...listeners}>⠿</span>

      {/* Case à cocher */}
      <button
        className={`task-item__check ${tache.termine ? 'checked' : ''}`}
        onClick={() => onCocher(tache.id)}
        title="Marquer comme fait"
      >
        {tache.termine ? '✓' : ''}
      </button>

      {/* Contenu */}
      <div className="task-item__body">
        {enEdition ? (
          <input
            className="task-item__edit-input"
            value={titreDraft}
            autoFocus
            onChange={(e) => setTitreDraft(e.target.value)}
            onBlur={validerEdition}
            onKeyDown={(e) => {
              if (e.key === 'Enter') validerEdition()
              if (e.key === 'Escape') { setTitreDraft(tache.titre); setEnEdition(false) }
            }}
          />
        ) : (
          <span className="task-item__titre" onDoubleClick={() => setEnEdition(true)}>
            {tache.titre}
          </span>
        )}

        {tache.echeance && (
          <span className={`task-item__echeance ${classeEcheance(tache.echeance)}`}>
            {formatEcheance(tache.echeance)}
          </span>
        )}
      </div>

      {/* Menu actions */}
      <div className="task-item__menu-wrap">
        <button
          className="task-item__menu-btn"
          onClick={() => setMenuOuvert((v) => !v)}
          title="Actions"
        >
          ⋯
        </button>
        {menuOuvert && (
          <div className="task-item__dropdown" onMouseLeave={() => setMenuOuvert(false)}>
            <button onClick={() => { setEnEdition(true); setMenuOuvert(false) }}>✏ Éditer</button>
            <button onClick={() => { onSnooze(tache.id, 10); setMenuOuvert(false) }}>⏰ Snooze 10 min</button>
            <button onClick={() => { onSnooze(tache.id, 60); setMenuOuvert(false) }}>⏰ Snooze 1h</button>
            <button className="danger" onClick={() => onSupprimer(tache.id)}>🗑 Supprimer</button>
          </div>
        )}
      </div>
    </div>
  )
}

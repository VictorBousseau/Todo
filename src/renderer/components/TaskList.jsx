import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import TaskItem from './TaskItem'

export default function TaskList({ taches, onCocher, onSupprimer, onModifier, onSnooze, onReordonner }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const ancienIdx = taches.findIndex((t) => t.id === active.id)
    const nouvelIdx = taches.findIndex((t) => t.id === over.id)
    const reordonnees = arrayMove(taches, ancienIdx, nouvelIdx)
    onReordonner(reordonnees.map((t) => t.id))
  }

  if (taches.length === 0) {
    return (
      <div className="task-list__vide">
        <p>Aucune tâche</p>
        <p className="task-list__vide-hint">↓ Ajoute ta première tâche</p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={taches.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="task-list">
          {taches.map((tache) => (
            <TaskItem
              key={tache.id}
              tache={tache}
              onCocher={onCocher}
              onSupprimer={onSupprimer}
              onModifier={onModifier}
              onSnooze={onSnooze}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

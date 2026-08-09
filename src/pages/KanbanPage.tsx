import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors,
  useDroppable, useDraggable, closestCorners,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { useStore } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import type { Task, TaskStatus, Category } from '../types';
import { BADGES } from '../data/badges';
import { priorityColor, priorityLabel, getCategoryName, getCategoryColor, formatDate } from '../utils/taskHelpers';
import './KanbanPage.css';

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: '待办', color: '#6c5ce7' },
  { id: 'doing', title: '进行中', color: '#fdcb6e' },
  { id: 'done', title: '已完成', color: '#00b894' },
];

export default function KanbanPage() {
  const navigate = useNavigate();
  const { tasks, categories, setTaskStatus } = useStore();
  const addToast = useToastStore(s => s.addToast);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], doing: [], done: [] };
    tasks.forEach(t => map[t.status].push(t));
    Object.values(map).forEach(arr => arr.sort((a, b) => a.order - b.order));
    return map;
  }, [tasks]);

  const handleDragStart = (e: DragStartEvent) => {
    const task = tasks.find(t => t.id === e.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const task = tasks.find(t => t.id === activeId);
    if (!task) return;

    // 确定目标状态：overId 可能是列 id（todo/doing/done）或某任务 id
    let targetStatus: TaskStatus | null = null;

    if (COLUMNS.some(c => c.id === overId)) {
      targetStatus = overId as TaskStatus;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) targetStatus = overTask.status;
    }

    if (!targetStatus || targetStatus === task.status) return;

    if (targetStatus === 'done' && task.status !== 'done') {
      const result = useStore.getState().toggleTaskComplete(task.id);
      if (result.pointsEarned > 0) {
        addToast({ icon: '⭐', title: `+${result.pointsEarned} 经验值！` });
      }
      result.newBadges.forEach(badgeId => {
        const badge = BADGES.find(b => b.id === badgeId);
        if (badge) addToast({ icon: badge.icon, title: `获得徽章：${badge.name}` });
      });
      if (result.bossDefeated) addToast({ icon: '🎉', title: 'Boss 已击败！' });
      if (result.storyUnlocked && result.storyUnlocked > 0) {
        addToast({ icon: '🗺️', title: '新章节已解锁！' });
      }
    } else {
      setTaskStatus(task.id, targetStatus);
    }
  };

  return (
    <div className="page kanban-page">
      <div className="page-header">
        <h1 className="page-title">看板</h1>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              color={col.color}
              tasks={tasksByStatus[col.id]}
              categories={categories}
              onTaskClick={(id) => navigate(`/task/${id}`)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanCard task={activeTask} categories={categories} dragging />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function KanbanColumn({
  id, title, color, tasks, categories, onTaskClick,
}: {
  id: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
  categories: Category[];
  onTaskClick: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className={`kanban-column ${isOver ? 'drag-over' : ''}`}>
      <div className="kanban-column-header">
        <span className="kanban-column-dot" style={{ background: color }} />
        <span className="kanban-column-title">{title}</span>
        <span className="kanban-column-count">{tasks.length}</span>
      </div>
      <div className="kanban-column-body" ref={setNodeRef}>
        {tasks.length === 0 && (
          <div className="kanban-empty">拖拽任务到此处</div>
        )}
        {tasks.map(task => (
          <KanbanCard
            key={task.id}
            task={task}
            categories={categories}
            onClick={() => onTaskClick(task.id)}
          />
        ))}
      </div>
    </div>
  );
}

function KanbanCard({
  task, categories, onClick, dragging,
}: {
  task: Task;
  categories: Category[];
  onClick?: () => void;
  dragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });

  const catName = getCategoryName(categories, task.categoryId);
  const catColor = getCategoryColor(categories, task.categoryId);

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  if (dragging) {
    return (
      <div className="kanban-card dragging">
        <div className="kanban-card-priority-bar" style={{ background: priorityColor(task.priority) }} />
        <div className="kanban-card-content">
          <div className={`kanban-card-title ${task.status === 'done' ? 'done' : ''}`}>
            {task.status === 'done' && '✅ '}{task.title}
          </div>
          <div className="kanban-card-meta">
            {task.priority && (
              <span className="tag" style={{ background: priorityColor(task.priority) + '22', color: priorityColor(task.priority) }}>
                {priorityLabel(task.priority)}
              </span>
            )}
            {catName && (
              <span className="tag" style={{ background: catColor + '22', color: catColor }}>{catName}</span>
            )}
            {task.dueDate && <span className="kanban-card-due">📅 {formatDate(task.dueDate)}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'dragging-active' : ''}`}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      <div className="kanban-card-priority-bar" style={{ background: priorityColor(task.priority) }} />
      <div className="kanban-card-content">
        <div className={`kanban-card-title ${task.status === 'done' ? 'done' : ''}`}>
          {task.status === 'done' && '✅ '}{task.title}
        </div>
        <div className="kanban-card-meta">
          {task.priority && (
            <span className="tag" style={{ background: priorityColor(task.priority) + '22', color: priorityColor(task.priority) }}>
              {priorityLabel(task.priority)}
            </span>
          )}
          {catName && (
            <span className="tag" style={{ background: catColor + '22', color: catColor }}>{catName}</span>
          )}
          {task.dueDate && <span className="kanban-card-due">📅 {formatDate(task.dueDate)}</span>}
        </div>
      </div>
    </div>
  );
}

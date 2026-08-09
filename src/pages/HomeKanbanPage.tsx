import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors,
  useDroppable, useDraggable, closestCorners,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { useStore } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';
import { BADGES } from '../data/badges';
import {
  IconPlus, IconSearch, IconCalendar, IconCheckCircle, IconList, IconColumns,
  IconFlame,
} from '../components/common/Icons';
import { isToday, isOverdue, formatDate, priorityColor, priorityLabel, getCategoryName, getCategoryColor } from '../utils/taskHelpers';
import type { Task, TaskStatus, Category } from '../types';
import './HomeKanbanPage.css';

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: '待办', color: '#6c5ce7' },
  { id: 'doing', title: '进行中', color: '#fdcb6e' },
  { id: 'done', title: '已完成', color: '#00b894' },
];

type ViewMode = 'list' | 'kanban';

export default function HomeKanbanPage() {
  const navigate = useNavigate();
  const { tasks, categories, userProfile, addTask, toggleTaskComplete, setTaskStatus } = useStore();
  const addToast = useToastStore(s => s.addToast);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickDate, setQuickDate] = useState('');

  // Kanban drag state
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
      .filter(t => !filterCategory || t.categoryId === filterCategory);
  }, [tasks, search, filterCategory]);

  const sortedListTasks = useMemo(() => {
    return [...filteredTasks]
      .filter(t => t.status !== 'done')
      .sort((a, b) => {
        const aOverdue = isOverdue(a.dueDate, a.status);
        const bOverdue = isOverdue(b.dueDate, b.status);
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return a.order - b.order;
      });
  }, [filteredTasks]);

  const todayTasks = sortedListTasks.filter(t => isToday(t.dueDate));
  const otherTasks = sortedListTasks.filter(t => !isToday(t.dueDate));

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], doing: [], done: [] };
    filteredTasks.forEach(t => map[t.status].push(t));
    Object.values(map).forEach(arr => arr.sort((a, b) => a.order - b.order));
    return map;
  }, [filteredTasks]);

  const handleQuickAdd = () => {
    if (!quickTitle.trim()) return;
    addTask({
      title: quickTitle.trim(),
      categoryId: quickCategory || null,
      dueDate: quickDate || null,
      status: 'todo',
    });
    setQuickTitle('');
    setQuickCategory('');
    setQuickDate('');
    setShowQuickAdd(false);
    addToast({ icon: '✅', title: '任务已添加', subtitle: quickTitle.trim() });
  };

  const handleToggle = (id: string) => {
    const result = toggleTaskComplete(id);
    if (result.pointsEarned > 0) {
      addToast({ icon: '⭐', title: `+${result.pointsEarned} 经验值！` });
    }
    result.newBadges.forEach(badgeId => {
      const badge = BADGES.find(b => b.id === badgeId);
      if (badge) addToast({ icon: '★', title: `获得徽章：${badge.name}` });
    });
    if (result.bossDefeated) addToast({ icon: '★', title: 'Boss 已击败！' });
    if (result.storyUnlocked && result.storyUnlocked > 0) {
      addToast({ icon: '◆', title: '新章节已解锁！' });
    }
  };

  // Kanban drag handlers
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
      addToast({ icon: '★', title: `+${result.pointsEarned} 经验值！` });
    }
    result.newBadges.forEach(badgeId => {
      const badge = BADGES.find(b => b.id === badgeId);
      if (badge) addToast({ icon: '★', title: `获得徽章：${badge.name}` });
    });
    if (result.bossDefeated) addToast({ icon: '★', title: 'Boss 已击败！' });
    } else {
      setTaskStatus(task.id, targetStatus);
    }
  };

  return (
    <div className="page home-kanban-page">
      {/* 顶部工具栏 */}
      <div className="hk-toolbar">
        <div className="hk-search-wrap">
          <IconSearch size={18} color="var(--color-text-light)" className="hk-search-icon" />
          <input
            className="hk-search-input"
            placeholder="搜索任务..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="hk-view-toggle">
          <button
            className={`hk-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <IconList size={18} color={viewMode === 'list' ? '#fff' : 'var(--color-text-light)'} />
          </button>
          <button
            className={`hk-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
          >
            <IconColumns size={18} color={viewMode === 'kanban' ? '#fff' : 'var(--color-text-light)'} />
          </button>
        </div>
      </div>

      {/* 简洁统计条 */}
      <div className="hk-stats-bar">
        <span className="hk-stat-item">
          <IconFlame size={14} color="#e17055" /> {userProfile.currentStreak} 天连续
        </span>
        <span className="hk-stat-divider">|</span>
        <span className="hk-stat-item">待办 {tasksByStatus.todo.length}</span>
        <span className="hk-stat-divider">|</span>
        <span className="hk-stat-item">进行中 {tasksByStatus.doing.length}</span>
        <span className="hk-stat-divider">|</span>
        <span className="hk-stat-item">已完成 {tasksByStatus.done.length}</span>
      </div>

      {/* 分类筛选 */}
      <div className="home-category-filter">
        <button
          className={`category-chip ${!filterCategory ? 'active' : ''}`}
          onClick={() => setFilterCategory('')}
        >全部</button>
        {categories.map(c => (
          <button
            key={c.id}
            className={`category-chip ${filterCategory === c.id ? 'active' : ''}`}
            style={filterCategory === c.id ? { background: c.color, color: '#fff' } : {}}
            onClick={() => setFilterCategory(c.id)}
          >
            <span className="category-dot" style={{ background: c.color }} />
            {c.name}
          </button>
        ))}
      </div>

      {/* 列表视图 */}
      {viewMode === 'list' && (
        <>
          {todayTasks.length > 0 && (
            <div className="task-section">
              <h3 className="task-section-title">今日任务</h3>
              {todayTasks.map(t => (
                <ListTaskCard key={t.id} task={t} onToggle={handleToggle} onClick={() => navigate(`/task/${t.id}`)} categories={categories} />
              ))}
            </div>
          )}
          <div className="task-section">
            {todayTasks.length === 0 && otherTasks.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon-flat">
                  <IconCheckCircle size={48} color="var(--color-text-light)" />
                </div>
                <p>暂无任务，点击右下角按钮添加</p>
              </div>
            )}
            {todayTasks.length > 0 && otherTasks.length > 0 && (
              <h3 className="task-section-title">其他任务</h3>
            )}
            {otherTasks.map(t => (
              <ListTaskCard key={t.id} task={t} onToggle={handleToggle} onClick={() => navigate(`/task/${t.id}`)} categories={categories} />
            ))}
          </div>
        </>
      )}

      {/* 看板视图 */}
      {viewMode === 'kanban' && (
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
      )}

      {/* 悬浮添加按钮 */}
      <button className="fab" onClick={() => setShowQuickAdd(true)}>
        <IconPlus size={26} color="#fff" />
      </button>

      {/* 快速添加弹窗 */}
      <Modal open={showQuickAdd} onClose={() => setShowQuickAdd(false)} title="快速添加任务">
        <div className="quick-add-form">
          <div className="form-group">
            <input
              className="form-input"
              placeholder="任务标题..."
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">分类</label>
            <select className="form-select" value={quickCategory} onChange={e => setQuickCategory(e.target.value)}>
              <option value="">无分类</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">截止日期</label>
            <input type="date" className="form-input" value={quickDate} onChange={e => setQuickDate(e.target.value)} />
          </div>
          <div className="quick-add-actions">
            <button className="btn btn-secondary" onClick={() => setShowQuickAdd(false)}>取消</button>
            <button className="btn btn-primary" onClick={handleQuickAdd} disabled={!quickTitle.trim()}>添加</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ===== List Task Card =====
function ListTaskCard({ task, onToggle, onClick, categories }: {
  task: Task;
  onToggle: (id: string) => void;
  onClick: () => void;
  categories: Category[];
}) {
  const overdue = isOverdue(task.dueDate, task.status);
  const catName = getCategoryName(categories, task.categoryId);
  const catColor = getCategoryColor(categories, task.categoryId);

  return (
    <div className={`task-card ${overdue ? 'overdue' : ''}`}>
      <button
        className="task-checkbox"
        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
      >
        {task.status === 'done' ? (
          <IconCheckCircle size={22} color="var(--color-primary)" />
        ) : (
          <span className="checkbox-circle" />
        )}
      </button>
      <div className="task-card-body" onClick={onClick}>
        <div className={`task-card-title ${task.status === 'done' ? 'done-text' : ''}`}>{task.title}</div>
        <div className="task-card-meta">
          {task.priority && (
            <span className="tag" style={{ background: priorityColor(task.priority) + '22', color: priorityColor(task.priority) }}>
              {priorityLabel(task.priority)}
            </span>
          )}
          {catName && (
            <span className="tag" style={{ background: catColor + '22', color: catColor }}>
              {catName}
            </span>
          )}
          {task.dueDate && (
            <span className={`task-due ${overdue ? 'overdue-text' : ''}`}>
              <IconCalendar size={13} color={overdue ? 'var(--color-danger)' : 'var(--color-text-secondary)'} />
              <span style={{ marginLeft: 3 }}>{formatDate(task.dueDate)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Kanban Column =====
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

// ===== Kanban Card =====
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
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  const cardContent = (
    <>
      <div className="kanban-card-priority-bar" style={{ background: priorityColor(task.priority) }} />
      <div className="kanban-card-content">
        <div className={`kanban-card-title ${task.status === 'done' ? 'done' : ''}`}>
          {task.title}
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
          {task.dueDate && (
            <span className="kanban-card-due">
              <IconCalendar size={12} color="var(--color-text-secondary)" />
              <span style={{ marginLeft: 3 }}>{formatDate(task.dueDate)}</span>
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (dragging) {
    return <div className="kanban-card dragging">{cardContent}</div>;
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
      {cardContent}
    </div>
  );
}

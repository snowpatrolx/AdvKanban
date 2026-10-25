import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';
import { NotesModal } from '../components/common/NotesModal';
import { BADGES } from '../data/badges';
import {
  IconPlus, IconCheckCircle, IconCalendar, IconRepeat, IconChevronDown, IconChevronRight,
  IconSubtask, IconNote, IconColumns, IconFlame, IconCoins, IconTag,
} from '../components/common/Icons';
import { isToday, isOverdue, formatDate, priorityColor, priorityLabel, getCategoryName, getCategoryColor, isTaskToday, getDaysUntilDue, formatDaysUntil } from '../utils/taskHelpers';
import type { Task, TaskStatus, Category, TaskPriority } from '../types';
import './HomeKanbanPage.css';
import './WheelHomePage.css';

// 优先级排序权重
function priorityWeight(p: TaskPriority): number {
  switch (p) {
    case 'high': return 0;
    case 'medium': return 1;
    case 'low': return 2;
    default: return 3;
  }
}

export default function WheelHomePage() {
  const navigate = useNavigate();
  const { tasks, categories, tags, userProfile, toggleTaskComplete, toggleSubtask, addTask, syncRepeatDates, resetDailyTasks } = useStore();
  const addToast = useToastStore(s => s.addToast);

  useEffect(() => {
    syncRepeatDates();
    resetDailyTasks();
  }, [syncRepeatDates, resetDailyTasks]);

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickDate, setQuickDate] = useState('');
  const [quickStatus, setQuickStatus] = useState<TaskStatus>('todo');

  // 今日完成数（主任务 + 子任务 + daily 任务今日完成）
  const todayCompletedCount = useMemo(
    () => tasks.filter(t => t.status === 'done' && isToday(t.completedAt)).length
      + tasks.filter(t => t.status === 'daily' && t.completedAt && isToday(t.completedAt)).length,
    [tasks],
  );

  // 每日任务（status = daily），未归档
  const dailyTasks = useMemo(() => {
    return tasks
      .filter(t => !t.parentId && t.status === 'daily' && !t.archived)
      .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority) || a.order - b.order);
  }, [tasks]);

  // 当日任务（isTaskToday 为真，但排除 daily，因为 daily 已单独展示）
  const todayTasks = useMemo(() => {
    return tasks
      .filter(t => !t.parentId && !t.archived && isTaskToday(t) && t.status !== 'daily')
      .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority) || a.order - b.order);
  }, [tasks]);

  const handleQuickAdd = () => {
    if (!quickTitle.trim()) return;
    addTask({
      title: quickTitle.trim(),
      categoryId: quickCategory || null,
      dueDate: quickDate || null,
      status: quickStatus,
    });
    setQuickTitle('');
    setQuickCategory('');
    setQuickDate('');
    setQuickStatus('todo');
    setShowQuickAdd(false);
    addToast({ icon: '✓', title: '任务已添加', subtitle: quickTitle.trim() });
  };

  const handleToggle = (id: string) => {
    const result = toggleTaskComplete(id);
    if (result.pointsEarned > 0) addToast({ icon: '★', title: `+${result.pointsEarned} 经验值！` });
    if (result.coinsEarned > 0) addToast({ icon: '◉', title: `+${result.coinsEarned} 金币` });
    result.newBadges.forEach(badgeId => {
      const badge = BADGES.find(b => b.id === badgeId);
      if (badge) addToast({ icon: '★', title: `获得徽章：${badge.name}` });
    });
    if (result.bossDefeated) addToast({ icon: '★', title: 'Boss 已击败！' });
    if (result.storyUnlocked && result.storyUnlocked > 0) addToast({ icon: '◆', title: '新章节已解锁！' });
  };

  const handleToggleSubtask = (id: string) => {
    const result = toggleSubtask(id);
    if (result.bossDamage > 0) addToast({ icon: '⚔', title: `子任务对 Boss 造成 ${result.bossDamage} 点伤害！` });
    if (result.coinsEarned > 0) addToast({ icon: '◉', title: `+${result.coinsEarned} 金币` });
    if (result.bossDefeated) addToast({ icon: '★', title: 'Boss 已击败！' });
    if (result.storyUnlocked && result.storyUnlocked > 0) addToast({ icon: '◆', title: '新章节已解锁！' });
  };

  return (
    <div className="page wheel-home-page">
      {/* 顶部：金币 + 连续天数 */}
      <div className="wh-top-bar">
        <div className="wh-stat-chip">
          <IconCoins size={16} color="#ffd93d" />
          <span className="wh-stat-value">{userProfile.coins}</span>
          <span className="wh-stat-label">金币</span>
        </div>
        <div className="wh-stat-chip">
          <IconFlame size={16} color="#e17055" />
          <span className="wh-stat-value">{userProfile.currentStreak}</span>
          <span className="wh-stat-label">天连续</span>
        </div>
        <button className="wh-kanban-btn" onClick={() => navigate('/tags')}>
          <IconTag size={16} color="#fff" />
          <span>标签</span>
        </button>
        <button className="wh-kanban-btn wh-kanban-btn-secondary" onClick={() => navigate('/kanban')}>
          <IconColumns size={16} color="var(--color-primary)" />
          <span>全部任务</span>
        </button>
      </div>

      {/* 轮盘 */}
      <DailyWheelCard count={todayCompletedCount} />

      {/* 每日任务 */}
      <div className="wh-section">
        <div className="wh-section-header">
          <h3 className="wh-section-title">每日任务</h3>
          <span className="wh-section-count">{dailyTasks.filter(t => t.completedAt && isToday(t.completedAt)).length}/{dailyTasks.length}</span>
        </div>
        {dailyTasks.length === 0 ? (
          <div className="wh-empty">
            <p>还没有每日任务，点击右下角按钮添加</p>
          </div>
        ) : (
          dailyTasks.map(t => (
            <WheelTaskCard
              key={t.id}
              task={t}
              onToggle={handleToggle}
              onClick={() => navigate(`/task/${t.id}`)}
              categories={categories}
              tags={tags}
              allTasks={tasks}
              onToggleSubtask={handleToggleSubtask}
            />
          ))
        )}
      </div>

      {/* 当日任务 */}
      <div className="wh-section">
        <div className="wh-section-header">
          <h3 className="wh-section-title">当日任务</h3>
          <span className="wh-section-count">{todayTasks.length}</span>
        </div>
        {todayTasks.length === 0 ? (
          <div className="wh-empty">
            <p>今天没有其他任务</p>
          </div>
        ) : (
          todayTasks.map(t => (
            <WheelTaskCard
              key={t.id}
              task={t}
              onToggle={handleToggle}
              onClick={() => navigate(`/task/${t.id}`)}
              categories={categories}
              tags={tags}
              allTasks={tasks}
              onToggleSubtask={handleToggleSubtask}
            />
          ))
        )}
      </div>

      {/* 悬浮按钮 */}
      <button className="fab fab-note" onClick={() => setShowNotes(true)}>
        <IconNote size={22} color="#fff" />
      </button>
      <button className="fab" onClick={() => setShowQuickAdd(true)}>
        <IconPlus size={26} color="#fff" />
      </button>

      {/* 便签弹窗 */}
      <NotesModal open={showNotes} onClose={() => setShowNotes(false)} />

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
          <div className="form-group">
            <label className="form-label">状态</label>
            <div className="quick-status-selector">
              {(['todo', 'doing', 'daily', 'done'] as TaskStatus[]).map(s => (
                <button
                  key={s}
                  type="button"
                  className={`quick-status-btn ${quickStatus === s ? 'active' : ''}`}
                  onClick={() => setQuickStatus(s)}
                >
                  {s === 'todo' ? '待办' : s === 'doing' ? '进行中' : s === 'daily' ? '每日' : '已完成'}
                </button>
              ))}
            </div>
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

// ===== Wheel Task Card =====
function WheelTaskCard({ task, onToggle, onClick, categories, tags, allTasks, onToggleSubtask }: {
  task: Task;
  onToggle: (id: string) => void;
  onClick: () => void;
  categories: Category[];
  tags: { id: string; name: string; color: string }[];
  allTasks: Task[];
  onToggleSubtask: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const overdue = isOverdue(task.dueDate, task.status);
  const catName = getCategoryName(categories, task.categoryId);
  const catColor = getCategoryColor(categories, task.categoryId);

  const subtasks = allTasks.filter(t => t.parentId === task.id);
  const incompleteSubtasks = subtasks.filter(t => t.status !== 'done');
  const firstIncompleteSubtask = incompleteSubtasks[0];
  const taskTags = tags.filter(t => (task.tagIds || []).includes(t.id));

  const isCompleted = task.status === 'done' || (task.status === 'daily' && !!task.completedAt && isToday(task.completedAt));

  return (
    <div className={`task-card ${overdue ? 'overdue' : ''}`}>
      <button
        className="task-checkbox"
        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
      >
        {isCompleted ? (
          <IconCheckCircle size={22} color="var(--color-primary)" />
        ) : (
          <span className="checkbox-circle" />
        )}
      </button>
      <div className="task-card-body" onClick={onClick}>
        <div className={`task-card-title ${isCompleted ? 'done-text' : ''}`}>
          {task.title}
          {task.repeat !== 'none' && (
            <span className="task-repeat-badge">
              <IconRepeat size={12} color="var(--color-text-light)" />
              <span className="task-repeat-count">{task.repeatCount || 0}</span>
              {(() => {
                const days = getDaysUntilDue(task);
                if (days !== null && days >= 0) {
                  return <span className="task-repeat-days">{formatDaysUntil(days)}</span>;
                }
                return null;
              })()}
            </span>
          )}
        </div>
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
          {taskTags.map(tag => (
            <span
              key={tag.id}
              className="tag task-tag-chip"
              style={{ background: tag.color + '22', color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {task.dueDate && (
            <span className={`task-due ${overdue ? 'overdue-text' : ''}`}>
              <IconCalendar size={13} color={overdue ? 'var(--color-danger)' : 'var(--color-text-secondary)'} />
              <span style={{ marginLeft: 3 }}>{formatDate(task.dueDate)}</span>
            </span>
          )}
          {subtasks.length > 0 && (
            <span className="tag tag-subtask" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
              <IconSubtask size={12} color="var(--color-text-secondary)" />
              {subtasks.filter(t => t.status === 'done').length}/{subtasks.length}
              {expanded ? <IconChevronDown size={14} color="var(--color-text-light)" /> : <IconChevronRight size={14} color="var(--color-text-light)" />}
            </span>
          )}
        </div>

        {!expanded && firstIncompleteSubtask && (
          <div className="subtask-preview" onClick={(e) => { e.stopPropagation(); onToggleSubtask(firstIncompleteSubtask.id); }}>
            <span className="subtask-preview-dot" />
            <span className="subtask-preview-text">{firstIncompleteSubtask.title}</span>
          </div>
        )}

        {expanded && subtasks.length > 0 && (
          <div className="subtask-list">
            {subtasks.map(st => (
              <div key={st.id} className="subtask-item" onClick={(e) => { e.stopPropagation(); onToggleSubtask(st.id); }}>
                <span className={`subtask-check ${st.status === 'done' ? 'done' : ''}`}>
                  {st.status === 'done' && <IconCheckCircle size={16} color="var(--color-primary)" />}
                </span>
                <span className={`subtask-title ${st.status === 'done' ? 'done-text' : ''}`}>{st.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 每日任务轮盘 =====
const WHEEL_SEGMENTS = 12;

function polarPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(cx: number, cy: number, rOuter: number, rInner: number, startDeg: number, endDeg: number) {
  const p1 = polarPoint(cx, cy, rOuter, startDeg);
  const p2 = polarPoint(cx, cy, rOuter, endDeg);
  const p3 = polarPoint(cx, cy, rInner, endDeg);
  const p4 = polarPoint(cx, cy, rInner, startDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M${p1.x} ${p1.y} A${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y} L${p3.x} ${p3.y} A${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y} Z`;
}

function wheelSegmentColor(i: number) {
  const t = i / (WHEEL_SEGMENTS - 1);
  const from = [108, 92, 231];
  const to = [0, 206, 201];
  const c = from.map((v, idx) => Math.round(v + (to[idx] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function DailyWheelCard({ count }: { count: number }) {
  const filled = Math.min(count, WHEEL_SEGMENTS);
  const seg = 360 / WHEEL_SEGMENTS;
  const gap = 3;
  const remaining = WHEEL_SEGMENTS - filled;

  return (
    <div className="daily-wheel-card">
      <div className="daily-wheel-svg-wrap">
        <svg viewBox="0 0 200 200" className="daily-wheel-svg" key={filled}>
          {Array.from({ length: WHEEL_SEGMENTS }).map((_, i) => (
            <path
              key={`bg-${i}`}
              d={sectorPath(100, 100, 88, 58, i * seg + gap / 2, (i + 1) * seg - gap / 2)}
              className="daily-wheel-seg-bg"
            />
          ))}
          {Array.from({ length: filled }).map((_, i) => (
            <path
              key={`fill-${i}`}
              d={sectorPath(100, 100, 88, 58, i * seg + gap / 2, (i + 1) * seg - gap / 2)}
              fill={wheelSegmentColor(i)}
              className="daily-wheel-seg-fill"
              style={{ animationDelay: `${i * 55}ms` }}
            />
          ))}
        </svg>
        <div className="daily-wheel-center">
          <span className="daily-wheel-count">{count}</span>
          <span className="daily-wheel-total">/{WHEEL_SEGMENTS}</span>
        </div>
      </div>
      <div className="daily-wheel-info">
        <div className="daily-wheel-title">今日任务轮盘</div>
        <div className="daily-wheel-desc">
          {remaining <= 0
            ? '今日轮盘已点亮，太棒了！'
            : `再完成 ${remaining} 个任务即可点亮整个轮盘`}
        </div>
        <div className="daily-wheel-hint">每天 0 点自动重置 · 完成任务获得金币</div>
      </div>
    </div>
  );
}

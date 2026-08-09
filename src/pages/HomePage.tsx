import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';
import { getLevelProgress } from '../utils/gamification';
import { isToday, isOverdue, formatDate, priorityColor, priorityLabel, getCategoryName, getCategoryColor } from '../utils/taskHelpers';
import { BADGES } from '../data/badges';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { tasks, categories, userProfile, addTask, toggleTaskComplete } = useStore();
  const addToast = useToastStore(s => s.addToast);

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickDate, setQuickDate] = useState('');

  const levelInfo = getLevelProgress(userProfile.totalPoints);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'done')
      .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
      .filter(t => !filterCategory || t.categoryId === filterCategory)
      .sort((a, b) => {
        // 今天到期的排前面，过期的更前面
        const aOverdue = isOverdue(a.dueDate, a.status);
        const bOverdue = isOverdue(b.dueDate, b.status);
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return a.order - b.order;
      });
  }, [tasks, search, filterCategory]);

  const todayTasks = filteredTasks.filter(t => isToday(t.dueDate));
  const otherTasks = filteredTasks.filter(t => !isToday(t.dueDate));

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
      addToast({ icon: '⭐', title: `+${result.pointsEarned} 经验值！`, subtitle: '继续加油！' });
    }
    result.newBadges.forEach(badgeId => {
      const badge = BADGES.find(b => b.id === badgeId);
      if (badge) {
        addToast({ icon: badge.icon, title: `获得徽章：${badge.name}`, subtitle: badge.description });
      }
    });
    if (result.bossDefeated) {
      addToast({ icon: '🎉', title: 'Boss 已击败！', subtitle: '冒险章节已推进' });
    }
    if (result.storyUnlocked && result.storyUnlocked > 0) {
      addToast({ icon: '🗺️', title: '新章节已解锁！', subtitle: '前往冒险页面查看' });
    }
  };

  return (
    <div className="page home-page">
      {/* 顶部用户信息 */}
      <div className="home-header-card">
        <div className="home-level-info">
          <div className="home-level-badge">Lv.{levelInfo.level}</div>
          <div className="home-level-detail">
            <div className="home-level-name">{levelInfo.name}</div>
            <div className="home-level-points">{userProfile.totalPoints} 经验值</div>
          </div>
        </div>
        <div className="home-progress-wrap">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${levelInfo.progress}%` }} />
          </div>
          {levelInfo.pointsToNext !== null && (
            <span className="home-progress-text">还需 {levelInfo.pointsToNext} 经验升级</span>
          )}
        </div>
        <div className="home-stats">
          <div className="home-stat">
            <span className="home-stat-value">{userProfile.currentStreak}</span>
            <span className="home-stat-label">连续天数 🔥</span>
          </div>
          <div className="home-stat">
            <span className="home-stat-value">{userProfile.completedTaskCount}</span>
            <span className="home-stat-label">已完成任务</span>
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="home-search-bar">
        <input
          className="form-input home-search-input"
          placeholder="搜索任务..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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

      {/* 今日任务 */}
      {todayTasks.length > 0 && (
        <div className="task-section">
          <h3 className="task-section-title">📌 今日任务</h3>
          {todayTasks.map(t => (
            <TaskCard key={t.id} task={t} onToggle={handleToggle} onClick={() => navigate(`/task/${t.id}`)} categories={categories} />
          ))}
        </div>
      )}

      {/* 其他任务 */}
      <div className="task-section">
        {todayTasks.length === 0 && otherTasks.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p>暂无任务，点击右下角按钮添加</p>
          </div>
        )}
        {todayTasks.length > 0 && otherTasks.length > 0 && (
          <h3 className="task-section-title">📋 其他任务</h3>
        )}
        {otherTasks.map(t => (
          <TaskCard key={t.id} task={t} onToggle={handleToggle} onClick={() => navigate(`/task/${t.id}`)} categories={categories} />
        ))}
      </div>

      {/* 悬浮添加按钮 */}
      <button className="fab" onClick={() => setShowQuickAdd(true)}>+</button>

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

function TaskCard({ task, onToggle, onClick, categories }: {
  task: import('../types').Task;
  onToggle: (id: string) => void;
  onClick: () => void;
  categories: import('../types').Category[];
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
        <span className="checkbox-circle" />
      </button>
      <div className="task-card-body" onClick={onClick}>
        <div className="task-card-title">{task.title}</div>
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
              📅 {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

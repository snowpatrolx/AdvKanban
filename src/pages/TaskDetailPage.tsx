import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import { ConfirmDialog } from '../components/common/Modal';
import { BADGES } from '../data/badges';
import {
  IconBack, IconTrash, IconPlus, IconCheckCircle, IconRepeat, IconSubtask, IconCheck, IconEdit,
} from '../components/common/Icons';
import type { TaskPriority, TaskStatus, RepeatType } from '../types';
import './TaskDetailPage.css';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, categories, addTask, updateTask, deleteTask, toggleTaskComplete, addSubtask, updateSubtask, deleteSubtask, toggleSubtask } = useStore();
  const addToast = useToastStore(s => s.addToast);

  const isNew = id === 'new' || !id;
  const existing = !isNew ? tasks.find(t => t.id === id) : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>(null);
  const [categoryId, setCategoryId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [repeat, setRepeat] = useState<RepeatType>('none');
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>([]);
  const [showDelete, setShowDelete] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');

  // 子任务列表
  const subtasks = !isNew ? tasks.filter(t => t.parentId === id) : [];

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description);
      setStatus(existing.status);
      setPriority(existing.priority);
      setCategoryId(existing.categoryId || '');
      setDueDate(existing.dueDate || '');
      setRepeat(existing.repeat || 'none');
      setRepeatWeekdays(existing.repeatWeekdays || []);
    }
  }, [existing]);

  const handleSave = () => {
    if (!title.trim()) return;

    const repeatData: Partial<{ repeat: RepeatType; repeatWeekdays: number[] }> = {
      repeat,
      repeatWeekdays: repeat === 'weekdays' ? repeatWeekdays : undefined,
    };

    if (isNew) {
      addTask({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        categoryId: categoryId || null,
        dueDate: dueDate || null,
        ...repeatData,
      });
      addToast({ icon: '✓', title: '任务已创建' });
    } else {
      const wasDone = existing?.status === 'done';
      updateTask(id!, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        categoryId: categoryId || null,
        dueDate: dueDate || null,
        ...repeatData,
      });

      if (!wasDone && status === 'done') {
        const result = toggleTaskComplete(id!);
        if (result.pointsEarned > 0) {
          addToast({ icon: '★', title: `+${result.pointsEarned} 经验值！` });
        }
        result.newBadges.forEach(badgeId => {
          const badge = BADGES.find(b => b.id === badgeId);
          if (badge) addToast({ icon: '★', title: `获得徽章：${badge.name}` });
        });
        if (result.bossDefeated) addToast({ icon: '★', title: 'Boss 已击败！' });
      }
      addToast({ icon: '✓', title: '任务已保存' });
    }
    navigate('/');
  };

  const handleDelete = () => {
    if (id) {
      deleteTask(id);
      addToast({ icon: '✗', title: '任务已删除' });
    }
    setShowDelete(false);
    navigate('/');
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim() || !id) return;
    addSubtask(id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
    addToast({ icon: '✓', title: '子任务已添加' });
  };

  const handleStartEditSubtask = (subtaskId: string, currentTitle: string) => {
    setEditingSubtaskId(subtaskId);
    setEditingSubtaskTitle(currentTitle);
  };

  const handleSaveEditSubtask = () => {
    if (!editingSubtaskId || !editingSubtaskTitle.trim()) return;
    updateSubtask(editingSubtaskId, { title: editingSubtaskTitle.trim() });
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
    addToast({ icon: '✓', title: '子任务已更新' });
  };

  const handleCancelEditSubtask = () => {
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    deleteSubtask(subtaskId);
    addToast({ icon: '✗', title: '子任务已删除' });
  };

  const handleToggleWeekday = (day: number) => {
    setRepeatWeekdays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const repeatLabels: Record<RepeatType, string> = {
    none: '不重复',
    daily: '每天',
    weekly: '每周',
    monthly: '每月',
    weekdays: '自定义',
    workdays: '法定工作日',
    holidays: '法定节假日',
  };

  return (
    <div className="page task-detail-page">
      <div className="page-header">
        <button className="page-back" onClick={() => navigate(-1)}>
          <IconBack size={20} color="var(--color-text)" />
        </button>
        <h1 className="page-title">{isNew ? '新建任务' : '编辑任务'}</h1>
        {!isNew && (
          <button className="btn btn-danger btn-sm detail-delete-btn" onClick={() => setShowDelete(true)}>
            <IconTrash size={14} color="#fff" />
          </button>
        )}
      </div>

      <div className="task-form">
        <div className="form-group">
          <label className="form-label">任务标题 *</label>
          <input
            className="form-input"
            placeholder="输入任务标题..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">描述</label>
          <textarea
            className="form-textarea"
            placeholder="详细说明（选填）..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label className="form-label">状态</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
              <option value="todo">待办</option>
              <option value="doing">进行中</option>
              <option value="done">已完成</option>
            </select>
          </div>
          <div className="form-group flex-1">
            <label className="form-label">优先级</label>
            <select className="form-select" value={priority || ''} onChange={e => setPriority(e.target.value as TaskPriority || null)}>
              <option value="">无</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label className="form-label">分类</label>
            <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">无分类</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group flex-1">
            <label className="form-label">截止日期</label>
            <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        {/* 重复任务设置 */}
        <div className="form-group">
          <label className="form-label">
            <IconRepeat size={16} color="var(--color-primary)" /> 重复
          </label>
          <div className="repeat-options">
            {(Object.keys(repeatLabels) as RepeatType[]).map(r => (
              <button
                key={r}
                className={`repeat-btn ${repeat === r ? 'active' : ''}`}
                onClick={() => setRepeat(r)}
              >
                {repeatLabels[r]}
              </button>
            ))}
          </div>

          {/* 自定义周几重复 */}
          {repeat === 'weekdays' && (
            <div className="repeat-weekdays">
              <p className="repeat-weekdays-hint">选择每周重复的日期</p>
              <div className="weekday-selector">
                {WEEKDAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    className={`weekday-btn ${repeatWeekdays.includes(idx) ? 'active' : ''}`}
                    onClick={() => handleToggleWeekday(idx)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 法定工作日提示 */}
          {repeat === 'workdays' && (
            <div className="repeat-info-hint">
              <p>任务将在每个法定工作日（周一至周五，排除法定节假日，含调休工作日）自动重复。</p>
            </div>
          )}

          {/* 法定节假日提示 */}
          {repeat === 'holidays' && (
            <div className="repeat-info-hint">
              <p>任务将在每个法定节假日（元旦、春节、清明、劳动节、端午、中秋、国庆）自动重复。</p>
            </div>
          )}

          {/* 重复计数 */}
          {!isNew && repeat !== 'none' && existing && (
            <div className="repeat-count-info">
              <span className="repeat-count-badge">第 {existing.repeatCount || 0} 次</span>
              <span className="repeat-count-desc">本任务已重复 {existing.repeatCount || 0} 次</span>
            </div>
          )}
        </div>

        {/* 子任务管理（仅编辑模式） */}
        {!isNew && (
          <div className="form-group">
            <label className="form-label">
              <IconSubtask size={16} color="var(--color-primary)" /> 子任务
            </label>
            <div className="subtask-manage-list">
              {subtasks.map(st => (
                <div key={st.id} className="subtask-manage-item">
                  {editingSubtaskId === st.id ? (
                    <>
                      <input
                        className="form-input subtask-edit-input"
                        value={editingSubtaskTitle}
                        onChange={e => setEditingSubtaskTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEditSubtask();
                          if (e.key === 'Escape') handleCancelEditSubtask();
                        }}
                        autoFocus
                      />
                      <button className="btn btn-primary btn-sm subtask-edit-confirm" onClick={handleSaveEditSubtask} disabled={!editingSubtaskTitle.trim()}>
                        <IconCheck size={14} color="#fff" />
                      </button>
                      <button className="btn btn-secondary btn-sm subtask-edit-cancel" onClick={handleCancelEditSubtask}>
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`subtask-check ${st.status === 'done' ? 'done' : ''}`} onClick={() => {
                        const result = toggleSubtask(st.id);
                        if (result.bossDamage > 0) {
                          addToast({ icon: '⚔', title: `子任务对 Boss 造成 ${result.bossDamage} 点伤害！` });
                        }
                        if (result.bossDefeated) addToast({ icon: '★', title: 'Boss 已击败！' });
                        if (result.storyUnlocked && result.storyUnlocked > 0) {
                          addToast({ icon: '◆', title: '新章节已解锁！' });
                        }
                      }}>
                        {st.status === 'done' && <IconCheckCircle size={16} color="var(--color-primary)" />}
                      </span>
                      <span className={`subtask-manage-title ${st.status === 'done' ? 'done-text' : ''}`}>{st.title}</span>
                      <button className="subtask-action-btn subtask-edit-btn" onClick={() => handleStartEditSubtask(st.id, st.title)}>
                        <IconEdit size={14} color="var(--color-text-light)" />
                      </button>
                      <button className="subtask-action-btn subtask-delete-btn" onClick={() => handleDeleteSubtask(st.id)}>
                        <IconTrash size={14} color="var(--color-danger)" />
                      </button>
                    </>
                  )}
                </div>
              ))}
              {subtasks.length === 0 && (
                <p className="subtask-empty-hint">暂无子任务</p>
              )}
            </div>
            <div className="subtask-add-row">
              <input
                className="form-input subtask-add-input"
                placeholder="添加子任务..."
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
              />
              <button className="btn btn-primary btn-sm" onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>
                <IconPlus size={16} color="#fff" />
              </button>
            </div>
          </div>
        )}

        {existing && (
          <div className="task-timestamps">
            <span>创建时间：{new Date(existing.createdAt).toLocaleString('zh-CN')}</span>
            {existing.completedAt && (
              <span>完成时间：{new Date(existing.completedAt).toLocaleString('zh-CN')}</span>
            )}
          </div>
        )}

        <div className="task-form-actions">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>取消</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!title.trim()}>
            {isNew ? '创建' : '保存'}
          </button>
        </div>
      </div>

      {/* 悬浮保存按钮 */}
      <button
        className={`floating-save-btn ${!title.trim() ? 'disabled' : ''}`}
        onClick={handleSave}
        disabled={!title.trim()}
        aria-label="保存"
      >
        <IconCheck size={24} color="#fff" />
      </button>

      <ConfirmDialog
        open={showDelete}
        title="删除任务"
        message="确定要删除这个任务吗？所有子任务也会被删除。"
        confirmText="删除"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

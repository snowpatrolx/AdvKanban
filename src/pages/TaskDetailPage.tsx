import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import { ConfirmDialog } from '../components/common/Modal';
import { BADGES } from '../data/badges';
import { IconBack, IconTrash } from '../components/common/Icons';
import type { TaskPriority, TaskStatus } from '../types';
import './TaskDetailPage.css';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks, categories, addTask, updateTask, deleteTask, toggleTaskComplete } = useStore();
  const addToast = useToastStore(s => s.addToast);

  const isNew = id === 'new' || !id;
  const existing = !isNew ? tasks.find(t => t.id === id) : null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>(null);
  const [categoryId, setCategoryId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description);
      setStatus(existing.status);
      setPriority(existing.priority);
      setCategoryId(existing.categoryId || '');
      setDueDate(existing.dueDate || '');
    }
  }, [existing]);

  const handleSave = () => {
    if (!title.trim()) return;

    if (isNew) {
      addTask({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        categoryId: categoryId || null,
        dueDate: dueDate || null,
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
      });

      // 如果状态从非完成变为完成，触发完成逻辑
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

      <ConfirmDialog
        open={showDelete}
        title="删除任务"
        message="确定要删除这个任务吗？此操作不可撤销。"
        confirmText="删除"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

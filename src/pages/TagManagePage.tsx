import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import { Modal, ConfirmDialog } from '../components/common/Modal';
import {
  IconBack, IconPlus, IconTag, IconTrash, IconCalendar, IconCheckCircle, IconClock,
} from '../components/common/Icons';
import { statusLabel, formatDate, isOverdue } from '../utils/taskHelpers';
import type { Task } from '../types';
import './CategoryManagePage.css';
import './TagManagePage.css';

const COLORS = ['#6c5ce7', '#00b894', '#fdcb6e', '#e74c3c', '#0984e3', '#e84393', '#00cec9', '#fd79a8'];

export default function TagManagePage() {
  const navigate = useNavigate();
  const { tags, tasks, addTag, updateTag, deleteTag } = useStore();
  const addToast = useToastStore(s => s.addToast);

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string>('');

  const openAdd = () => {
    setName('');
    setColor(COLORS[0]);
    setEditId(null);
    setShowAdd(true);
  };

  const openEdit = (id: string, tagName: string, tagColor: string) => {
    setName(tagName);
    setColor(tagColor);
    setEditId(id);
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editId) {
      updateTag(editId, { name: name.trim(), color });
      addToast({ icon: '✓', title: '标签已更新' });
    } else {
      addTag(name.trim(), color);
      addToast({ icon: '✓', title: '标签已添加' });
    }
    setShowAdd(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteTag(deleteId);
      if (activeTag === deleteId) setActiveTag('');
      addToast({ icon: '✗', title: '标签已删除' });
    }
    setDeleteId(null);
  };

  const tagCount = (tagId: string) =>
    tasks.filter(t => !t.archived && (t.tagIds || []).includes(tagId)).length;

  // 当前选中标签下的任务
  const tagTasks = useMemo(() => {
    const source = activeTag
      ? tasks.filter(t => !t.parentId && !t.archived && (t.tagIds || []).includes(activeTag))
      : tasks.filter(t => !t.parentId && !t.archived && (t.tagIds || []).length > 0);
    return [...source].sort((a, b) => {
      const doneA = a.status === 'done' ? 1 : 0;
      const doneB = b.status === 'done' ? 1 : 0;
      if (doneA !== doneB) return doneA - doneB;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [tasks, activeTag]);

  return (
    <div className="page tag-page">
      <div className="page-header">
        <button className="page-back" onClick={() => navigate('/profile')}>
          <IconBack size={20} color="var(--color-text)" />
        </button>
        <h1 className="page-title">标签</h1>
        <button className="btn btn-primary btn-sm cat-new-btn" onClick={openAdd}>
          <IconPlus size={16} color="#fff" /> 新建
        </button>
      </div>

      {/* 标签筛选 */}
      <div className="tag-filter-row">
        <button
          className={`tag-chip ${!activeTag ? 'active' : ''}`}
          onClick={() => setActiveTag('')}
        >
          全部标签
        </button>
        {tags.map(tag => (
          <button
            key={tag.id}
            className={`tag-chip ${activeTag === tag.id ? 'active' : ''}`}
            style={activeTag === tag.id ? { background: tag.color, borderColor: tag.color, color: '#fff' } : {}}
            onClick={() => setActiveTag(tag.id)}
          >
            <span className="tag-chip-dot" style={{ background: tag.color }} />
            {tag.name}
            <span className="tag-chip-count">{tagCount(tag.id)}</span>
          </button>
        ))}
      </div>

      {/* 标签管理列表 */}
      <div className="tag-manage-section">
        <h3 className="tag-section-title">我的标签</h3>
        <div className="category-list">
          {tags.map(tag => (
            <div key={tag.id} className="category-manage-item">
              <span className="category-manage-dot" style={{ background: tag.color }} />
              <span className="category-manage-name">{tag.name}</span>
              <span className="category-manage-count">{tagCount(tag.id)} 个任务</span>
              <div className="category-manage-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(tag.id, tag.name, tag.color)}>编辑</button>
                <button className="btn btn-danger btn-sm cat-delete-btn" onClick={() => setDeleteId(tag.id)}>
                  <IconTrash size={14} color="#fff" />
                </button>
              </div>
            </div>
          ))}
          {tags.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon-flat">
                <IconTag size={48} color="var(--color-text-light)" />
              </div>
              <p>暂无标签，点击右上角创建</p>
            </div>
          )}
        </div>
      </div>

      {/* 标签下的任务 */}
      <div className="tag-manage-section">
        <h3 className="tag-section-title">
          {activeTag ? `${tags.find(t => t.id === activeTag)?.name || ''} 的任务` : '已打标签的任务'}
          <span className="tag-task-count">{tagTasks.length}</span>
        </h3>
        {tagTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon-flat">
              <IconTag size={48} color="var(--color-text-light)" />
            </div>
            <p>还没有任务使用这个标签</p>
          </div>
        ) : (
          <div className="tag-task-list">
            {tagTasks.map(task => (
              <TagTaskRow
                key={task.id}
                task={task}
                tags={tags}
                onClick={() => navigate(`/task/${task.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editId ? '编辑标签' : '新建标签'}>
        <div className="form-group">
          <label className="form-label">标签名称</label>
          <input
            className="form-input"
            placeholder="输入标签名称..."
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">颜色</label>
          <div className="color-picker">
            {COLORS.map(c => (
              <button
                key={c}
                className={`color-option ${color === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
        <div className="task-form-actions">
          <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>取消</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>
            {editId ? '保存' : '创建'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="删除标签"
        message="删除标签后，任务上的该标签会被移除，任务本身不会删除。确定要删除吗？"
        confirmText="删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function TagTaskRow({ task, tags, onClick }: { task: Task; tags: { id: string; name: string; color: string }[]; onClick: () => void }) {
  const done = task.status === 'done';
  const overdue = isOverdue(task.dueDate, task.status);
  const taskTags = tags.filter(t => (task.tagIds || []).includes(t.id));

  return (
    <div className={`tag-task-row ${done ? 'done' : ''}`} onClick={onClick}>
      <span className="tag-task-status">
        {done
          ? <IconCheckCircle size={20} color="var(--color-primary)" />
          : <IconClock size={20} color="var(--color-text-light)" />}
      </span>
      <div className="tag-task-main">
        <div className={`tag-task-title ${done ? 'done-text' : ''}`}>{task.title}</div>
        <div className="tag-task-meta">
          <span className={`tag-task-status-label status-${task.status}`}>{statusLabel(task.status)}</span>
          {task.dueDate && (
            <span className={`tag-task-due ${overdue ? 'overdue-text' : ''}`}>
              <IconCalendar size={12} color={overdue ? 'var(--color-danger)' : 'var(--color-text-light)'} />
              {formatDate(task.dueDate)}
            </span>
          )}
          {taskTags.map(tag => (
            <span
              key={tag.id}
              className="tag-task-tag"
              style={{ background: tag.color + '22', color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

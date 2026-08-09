import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import { Modal, ConfirmDialog } from '../components/common/Modal';
import { IconBack, IconPlus, IconTag, IconTrash } from '../components/common/Icons';
import './CategoryManagePage.css';

const COLORS = ['#6c5ce7', '#00b894', '#fdcb6e', '#e74c3c', '#0984e3', '#e84393', '#00cec9', '#fd79a8'];

export default function CategoryManagePage() {
  const navigate = useNavigate();
  const { categories, tasks, addCategory, updateCategory, deleteCategory } = useStore();
  const addToast = useToastStore(s => s.addToast);

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setName('');
    setColor(COLORS[0]);
    setEditId(null);
    setShowAdd(true);
  };

  const openEdit = (id: string, catName: string, catColor: string) => {
    setName(catName);
    setColor(catColor);
    setEditId(id);
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (editId) {
      updateCategory(editId, { name: name.trim(), color });
      addToast({ icon: '✓', title: '分类已更新' });
    } else {
      addCategory(name.trim(), color);
      addToast({ icon: '✓', title: '分类已添加' });
    }
    setShowAdd(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteCategory(deleteId);
      addToast({ icon: '✗', title: '分类已删除' });
    }
    setDeleteId(null);
  };

  const taskCount = (catId: string) => tasks.filter(t => t.categoryId === catId).length;

  return (
    <div className="page">
      <div className="page-header">
        <button className="page-back" onClick={() => navigate('/profile')}>
          <IconBack size={20} color="var(--color-text)" />
        </button>
        <h1 className="page-title">分类管理</h1>
        <button className="btn btn-primary btn-sm cat-new-btn" onClick={openAdd}>
          <IconPlus size={16} color="#fff" /> 新建
        </button>
      </div>

      <div className="category-list">
        {categories.map(cat => (
          <div key={cat.id} className="category-manage-item">
            <span className="category-manage-dot" style={{ background: cat.color }} />
            <span className="category-manage-name">{cat.name}</span>
            <span className="category-manage-count">{taskCount(cat.id)} 个任务</span>
            <div className="category-manage-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(cat.id, cat.name, cat.color)}>编辑</button>
              <button className="btn btn-danger btn-sm cat-delete-btn" onClick={() => setDeleteId(cat.id)}>
                <IconTrash size={14} color="#fff" />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon-flat">
              <IconTag size={48} color="var(--color-text-light)" />
            </div>
            <p>暂无分类，点击右上角创建</p>
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editId ? '编辑分类' : '新建分类'}>
        <div className="form-group">
          <label className="form-label">分类名称</label>
          <input
            className="form-input"
            placeholder="输入分类名称..."
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
        title="删除分类"
        message={'删除分类后，该分类下的任务和知识将变为「无分类」。确定要删除吗？'}
        confirmText="删除"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

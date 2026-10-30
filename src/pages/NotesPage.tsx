import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import {
  IconBack, IconPlus, IconTrash, IconCheck,
} from '../components/common/Icons';
import './NotesPage.css';

const NOTE_COLORS = ['#ffd93d', '#ff8fab', '#74c0fc', '#8ce99a', '#b197fc'];

function formatNoteTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (sameDay) return `今天 ${hh}:${mm}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`;
}

export default function NotesPage() {
  const navigate = useNavigate();
  const { notes, addNote, deleteNote, noteToTask, updateNote } = useStore();
  const addToast = useToastStore(s => s.addToast);

  const [content, setContent] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const handleAdd = () => {
    if (!content.trim()) return;
    addNote(content, color);
    setContent('');
    addToast({ icon: '📝', title: '便签已添加' });
  };

  const handleStartEdit = (id: string, c: string) => {
    setEditingId(id);
    setEditingContent(c);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingContent.trim()) {
      setEditingId(null);
      return;
    }
    updateNote(editingId, { content: editingContent.trim() });
    setEditingId(null);
    setEditingContent('');
    addToast({ icon: '✓', title: '便签已更新' });
  };

  const handleConvert = (id: string) => {
    const taskId = noteToTask(id);
    if (taskId) {
      addToast({ icon: '✓', title: '已转换为任务', subtitle: '可在任务列表中查看' });
    }
  };

  // 按创建时间倒序
  const sortedNotes = [...notes].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="page notes-page">
      <div className="page-header">
        <button className="page-back" onClick={() => navigate(-1)}>
          <IconBack size={20} color="var(--color-text)" />
        </button>
        <h1 className="page-title">便签</h1>
        <div style={{ width: 36 }} />
      </div>

      {/* 快速添加 */}
      <div className="notes-card notes-add-card">
        <textarea
          className="notes-add-textarea"
          placeholder="随手记点什么…（可直接转为任务）"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
        />
        <div className="notes-add-footer">
          <div className="notes-color-picker">
            {NOTE_COLORS.map(c => (
              <button
                key={c}
                type="button"
                className={`notes-color-dot ${color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={!content.trim()}>
            <IconPlus size={14} color="#fff" /> 添加
          </button>
        </div>
      </div>

      {/* 便签列表 */}
      <div className="notes-grid">
        {sortedNotes.length === 0 && (
          <div className="notes-empty">
            <p>还没有便签，添加一个吧～</p>
          </div>
        )}
        {sortedNotes.map(note => (
          <div
            key={note.id}
            className={`notes-card sticky-note ${editingId === note.id ? 'editing' : ''}`}
            style={{ background: note.color }}
          >
            {editingId === note.id ? (
              <>
                <textarea
                  className="notes-edit-textarea"
                  value={editingContent}
                  onChange={e => setEditingContent(e.target.value)}
                  autoFocus
                  rows={Math.max(2, Math.ceil(editingContent.length / 20))}
                />
                <div className="sticky-note-footer">
                  <span className="sticky-note-time">{formatNoteTime(note.updatedAt || note.createdAt)}</span>
                  <div className="sticky-note-actions">
                    <button className="sticky-note-btn save" onClick={handleSaveEdit}>
                      <IconCheck size={15} color="#fff" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  className="sticky-note-content"
                  onClick={() => handleStartEdit(note.id, note.content)}
                >
                  {note.content}
                </div>
                <div className="sticky-note-footer">
                  <span className="sticky-note-time">{formatNoteTime(note.createdAt)}</span>
                  <div className="sticky-note-actions">
                    <button className="sticky-note-btn convert" onClick={() => handleConvert(note.id)}>
                      转为任务
                    </button>
                    <button className="sticky-note-btn delete" onClick={() => deleteNote(note.id)}>
                      <IconTrash size={15} color="#5a4a1a" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

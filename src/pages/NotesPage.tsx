import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import {
  IconBack, IconPlus, IconTrash, IconCheck,
} from '../components/common/Icons';
import './NotesPage.css';

const NOTE_COLORS = ['#ffe066', '#ffc9de', '#a5d8ff', '#b2f2bb', '#d0bfff', '#ffd8a8'];

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
      {/* 顶部标题 */}
      <div className="notes-topbar">
        <button className="notes-back" onClick={() => navigate(-1)}>
          <IconBack size={20} color="var(--color-text)" />
        </button>
        <div className="notes-heading">
          <h1>便签</h1>
          <p>{sortedNotes.length} 条记录 · 点击内容即可编辑</p>
        </div>
        <div className="notes-heading-deco">📝</div>
      </div>

      {/* 新建便签 */}
      <div className="notes-composer">
        <div className="notes-composer-accent" />
        <textarea
          className="notes-composer-input"
          placeholder="写下此刻的想法… 之后可以一键转为任务"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
        />
        <div className="notes-composer-footer">
          <div className="notes-palette-wrap">
            <span className="notes-palette-label">便签颜色</span>
            <div className="notes-palette">
              {NOTE_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`notes-color-dot ${color === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label="选择便签颜色"
                />
              ))}
            </div>
          </div>
          <button className="notes-add-btn" onClick={handleAdd} disabled={!content.trim()}>
            <IconPlus size={15} color="#fff" /> 添加便签
          </button>
        </div>
      </div>

      {/* 列表标题 */}
      <div className="notes-list-header">
        <span>全部便签</span>
        <span className="notes-count-badge">{sortedNotes.length}</span>
      </div>

      {/* 便签网格 */}
      {sortedNotes.length === 0 ? (
        <div className="notes-empty">
          <div className="notes-empty-emoji">🗒️</div>
          <p>还没有便签</p>
          <span>在上方写点什么，记录下第一个想法吧</span>
        </div>
      ) : (
        <div className="notes-grid">
          {sortedNotes.map(note => (
            <article
              key={note.id}
              className={`sticky-note ${editingId === note.id ? 'editing' : ''}`}
              style={{ background: note.color }}
            >
              <span className="sticky-note-tape" />
              {editingId === note.id ? (
                <>
                  <textarea
                    className="notes-edit-textarea"
                    value={editingContent}
                    onChange={e => setEditingContent(e.target.value)}
                    autoFocus
                    rows={Math.max(3, Math.ceil(editingContent.length / 18))}
                  />
                  <div className="sticky-note-footer">
                    <span className="sticky-note-time">{formatNoteTime(note.updatedAt || note.createdAt)}</span>
                    <div className="sticky-note-actions">
                      <button className="sticky-note-btn save" onClick={handleSaveEdit}>
                        <IconCheck size={15} color="#fff" /> 保存
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
                      <button className="sticky-note-btn delete" onClick={() => deleteNote(note.id)} aria-label="删除便签">
                        <IconTrash size={14} color="#7a5c1e" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

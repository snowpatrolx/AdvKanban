import { useState } from 'react';
import { Modal } from './Modal';
import { useStore } from '../../store/useStore';
import { useToastStore } from './Toast';
import { IconTrash, IconCheck } from './Icons';
import { NOTE_COLORS, noteTextColor } from '../../utils/noteColors';
import './NotesModal.css';

function formatNoteTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (sameDay) return `今天 ${hh}:${mm}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`;
}

export function NotesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notes, addNote, deleteNote, noteToTask, updateNote } = useStore();
  const addToast = useToastStore(s => s.addToast);

  const [content, setContent] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingColor, setEditingColor] = useState<string>(NOTE_COLORS[0]);

  const handleAdd = () => {
    if (!content.trim()) return;
    addNote(content, color);
    setContent('');
    addToast({ icon: '📝', title: '便签已添加' });
  };

  const handleConvert = (id: string) => {
    const taskId = noteToTask(id);
    if (taskId) {
      addToast({ icon: '✓', title: '已转换为任务', subtitle: '可在任务列表中查看' });
    }
  };

  const handleStartEdit = (id: string, c: string, currentColor: string) => {
    setEditingId(id);
    setEditingContent(c);
    setEditingColor(currentColor || NOTE_COLORS[0]);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingContent.trim()) {
      setEditingId(null);
      return;
    }
    updateNote(editingId, { content: editingContent.trim(), color: editingColor });
    setEditingId(null);
    setEditingContent('');
    addToast({ icon: '✓', title: '便签已更新' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  // 按创建时间倒序
  const sortedNotes = [...notes].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Modal open={open} onClose={onClose} title="便签">
      <div className="notes-modal">
        {/* 快速添加 */}
        <div className="notes-add">
          <textarea
            className="notes-textarea"
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
                  aria-label="选择便签颜色"
                />
              ))}
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={!content.trim()}>
              添加便签
            </button>
          </div>
        </div>

        {/* 便签列表 */}
        <div className="notes-list">
          {sortedNotes.length === 0 && (
            <div className="notes-empty">暂无便签</div>
          )}
          {sortedNotes.map(note => {
            const isEditing = editingId === note.id;
            const bg = isEditing ? editingColor : note.color;
            const textColor = noteTextColor(bg);
            return (
              <div key={note.id} className="sticky-note" style={{ background: bg, color: textColor }}>
                {isEditing ? (
                  <>
                    <textarea
                      className="notes-modal-edit-textarea"
                      value={editingContent}
                      onChange={e => setEditingContent(e.target.value)}
                      autoFocus
                      rows={3}
                    />
                    <div className="notes-color-picker">
                      {NOTE_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          className={`notes-color-dot ${editingColor === c ? 'active' : ''}`}
                          style={{ background: c }}
                          onClick={() => setEditingColor(c)}
                          aria-label="选择便签颜色"
                        />
                      ))}
                    </div>
                    <div className="sticky-note-footer">
                      <span className="sticky-note-time" style={{ color: textColor, opacity: 0.8 }}>
                        {formatNoteTime(note.updatedAt || note.createdAt)}
                      </span>
                      <div className="sticky-note-actions">
                        <button className="sticky-note-btn" onClick={handleCancelEdit}>取消</button>
                        <button className="sticky-note-btn save" onClick={handleSaveEdit}>
                          <IconCheck size={13} color="#fff" /> 保存
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="sticky-note-content"
                      style={{ color: textColor }}
                      onClick={() => handleStartEdit(note.id, note.content, note.color)}
                    >
                      {note.content}
                    </div>
                    <div className="sticky-note-footer">
                      <span className="sticky-note-time" style={{ color: textColor, opacity: 0.8 }}>
                        {formatNoteTime(note.createdAt)}
                      </span>
                      <div className="sticky-note-actions">
                        <button className="sticky-note-btn convert" onClick={() => handleConvert(note.id)}>
                          转为任务
                        </button>
                        <button className="sticky-note-btn delete" onClick={() => deleteNote(note.id)} aria-label="删除便签">
                          <IconTrash size={13} color={textColor} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

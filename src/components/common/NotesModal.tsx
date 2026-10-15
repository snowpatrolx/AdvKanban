import { useState } from 'react';
import { Modal } from './Modal';
import { useStore } from '../../store/useStore';
import { useToastStore } from './Toast';
import { IconTrash } from './Icons';
import './NotesModal.css';

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

export function NotesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { notes, addNote, deleteNote, noteToTask } = useStore();
  const addToast = useToastStore(s => s.addToast);

  const [content, setContent] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0]);

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
          {notes.length === 0 && (
            <div className="notes-empty">暂无便签</div>
          )}
          {notes.map(note => (
            <div key={note.id} className="sticky-note" style={{ background: note.color }}>
              <div className="sticky-note-content">{note.content}</div>
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
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

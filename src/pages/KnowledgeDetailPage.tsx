import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import { ConfirmDialog } from '../components/common/Modal';
import { IconBack, IconTrash, IconLink, IconVideo, IconExternalLink } from '../components/common/Icons';
import './TaskDetailPage.css';

export default function KnowledgeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { knowledge, categories, addKnowledge, updateKnowledge, deleteKnowledge } = useStore();
  const addToast = useToastStore(s => s.addToast);

  const isNew = id === 'new' || !id;
  const existing = !isNew ? knowledge.find(k => k.id === id) : null;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [link, setLink] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [videoNote, setVideoNote] = useState('');
  const [showVideoSection, setShowVideoSection] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setContent(existing.content);
      setCategoryId(existing.categoryId || '');
      setLink(existing.link || '');
      setVideoLink(existing.videoLink || '');
      setVideoNote(existing.videoNote || '');
      if (existing.videoLink) setShowVideoSection(true);
    }
  }, [existing]);

  const handleSave = () => {
    if (!title.trim()) return;
    // 简单验证 URL 格式
    let cleanLink = link.trim();
    if (cleanLink && !cleanLink.match(/^https?:\/\//)) {
      cleanLink = 'https://' + cleanLink;
    }
    let cleanVideoLink = videoLink.trim();
    if (cleanVideoLink && !cleanVideoLink.match(/^https?:\/\//)) {
      cleanVideoLink = 'https://' + cleanVideoLink;
    }

    if (isNew) {
      addKnowledge({
        title: title.trim(),
        content: content.trim(),
        categoryId: categoryId || null,
        link: cleanLink,
        videoLink: cleanVideoLink,
        videoNote: videoNote.trim(),
      });
      addToast({ icon: '★', title: '知识已创建', subtitle: '+5 经验值' });
    } else {
      updateKnowledge(id!, {
        title: title.trim(),
        content: content.trim(),
        categoryId: categoryId || null,
        link: cleanLink,
        videoLink: cleanVideoLink,
        videoNote: videoNote.trim(),
      });
      addToast({ icon: '✓', title: '知识已保存' });
    }
    navigate('/knowledge');
  };

  const handleDelete = () => {
    if (id) {
      deleteKnowledge(id);
      addToast({ icon: '✗', title: '知识已删除' });
    }
    setShowDelete(false);
    navigate('/knowledge');
  };

  // 检测视频平台
  const getVideoPlatform = (url: string): { name: string; embedUrl?: string } => {
    if (!url) return { name: '' };
    if (url.includes('bilibili.com') || url.includes('b23.tv')) {
      const bvMatch = url.match(/BV\w+/);
      if (bvMatch) {
        return { name: 'Bilibili', embedUrl: `https://player.bilibili.com/player.html?bvid=${bvMatch[0]}&high_quality=1` };
      }
      return { name: 'Bilibili' };
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = '';
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
      } else {
        videoId = url.match(/[?&]v=([^&]+)/)?.[1] || '';
      }
      if (videoId) {
        return { name: 'YouTube', embedUrl: `https://www.youtube.com/embed/${videoId}` };
      }
      return { name: 'YouTube' };
    }
    return { name: '视频' };
  };

  const videoPlatform = getVideoPlatform(videoLink);

  return (
    <div className="page task-detail-page">
      <div className="page-header">
        <button className="page-back" onClick={() => navigate(-1)}>
          <IconBack size={20} color="var(--color-text)" />
        </button>
        <h1 className="page-title">{isNew ? '新建知识' : '编辑知识'}</h1>
        {!isNew && (
          <button className="btn btn-danger btn-sm detail-delete-btn" onClick={() => setShowDelete(true)}>
            <IconTrash size={14} color="#fff" />
          </button>
        )}
      </div>

      <div className="task-form">
        <div className="form-group">
          <label className="form-label">标题 *</label>
          <input
            className="form-input"
            placeholder="输入知识标题..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">内容 *</label>
          <textarea
            className="form-textarea knowledge-textarea"
            placeholder="输入知识内容（支持简单 Markdown）..."
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>

        {/* 文章链接 */}
        <div className="form-group">
          <label className="form-label">
            <IconLink size={16} color="var(--color-primary)" /> 文章链接
          </label>
          <input
            className="form-input"
            placeholder="https://example.com/article"
            value={link}
            onChange={e => setLink(e.target.value)}
            type="url"
          />
        </div>

        {/* 视频链接 */}
        <div className="form-group">
          <button
            type="button"
            className="video-toggle-btn"
            onClick={() => setShowVideoSection(!showVideoSection)}
          >
            <IconVideo size={16} color="var(--color-primary)" />
            <span>视频链接{videoLink ? `（${videoPlatform.name}）` : ''}</span>
            <span className="video-toggle-arrow">{showVideoSection ? '−' : '+'}</span>
          </button>

          {showVideoSection && (
            <div className="video-section">
              <input
                className="form-input"
                placeholder="粘贴视频链接（支持 Bilibili / YouTube）"
                value={videoLink}
                onChange={e => setVideoLink(e.target.value)}
                type="url"
              />

              {/* 视频预览 */}
              {videoLink && videoPlatform.embedUrl && (
                <div className="video-preview">
                  <iframe
                    src={videoPlatform.embedUrl}
                    title="视频预览"
                    className="video-iframe"
                    allowFullScreen
                    scrolling="no"
                  />
                </div>
              )}
              {videoLink && !videoPlatform.embedUrl && (
                <a
                  href={videoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="video-link-external"
                >
                  <IconExternalLink size={14} color="var(--color-primary)" />
                  <span>打开视频</span>
                </a>
              )}

              {/* 视频笔记/文案 */}
              <label className="form-label video-note-label">视频笔记 / 文案</label>
              <textarea
                className="form-textarea video-note-textarea"
                placeholder="在这里记录视频中的要点、文案或笔记...&#10;&#10;提示：可以边看视频边记录关键内容"
                value={videoNote}
                onChange={e => setVideoNote(e.target.value)}
              />
              <p className="video-note-hint">
                将视频中的关键内容整理为文字笔记，方便日后查阅
              </p>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">分类</label>
          <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">无分类</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {existing && existing.link && (
          <a
            href={existing.link}
            target="_blank"
            rel="noopener noreferrer"
            className="knowledge-link-preview"
          >
            <IconLink size={16} color="var(--color-primary)" />
            <span className="knowledge-link-text">{existing.link}</span>
          </a>
        )}

        {existing && (
          <div className="task-timestamps">
            <span>创建时间：{new Date(existing.createdAt).toLocaleString('zh-CN')}</span>
            <span>更新时间：{new Date(existing.updatedAt).toLocaleString('zh-CN')}</span>
          </div>
        )}

        {/* 悬浮保存按钮 */}
        <button
          className="floating-save-btn"
          onClick={handleSave}
          disabled={!title.trim()}
        >
          {isNew ? '创建' : '保存'}
        </button>

        <div className="task-form-actions">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>取消</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!title.trim()}>
            {isNew ? '创建' : '保存'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="删除知识"
        message="确定要删除这条知识吗？此操作不可撤销。"
        confirmText="删除"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

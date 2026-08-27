import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import { ConfirmDialog } from '../components/common/Modal';
import { IconBack, IconTrash, IconLink, IconVideo, IconExternalLink, IconSparkles, IconClipboard } from '../components/common/Icons';
import { generateVideoNote, summarizeKnowledge } from '../utils/aiSummary';
import './TaskDetailPage.css';

export default function KnowledgeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { knowledge, categories, addKnowledge, updateKnowledge, deleteKnowledge } = useStore();
  const addToast = useToastStore(s => s.addToast);
  const contentRef = useRef<HTMLTextAreaElement>(null);

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
  const [showSummary, setShowSummary] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title || '');
      setContent(existing.content || '');
      setCategoryId(existing.categoryId || '');
      setLink(existing.link || '');
      setVideoLink(existing.videoLink || '');
      setVideoNote(existing.videoNote || '');
      if (existing.videoLink) setShowVideoSection(true);
    }
  }, [existing]);

  // 智能解析：从粘贴的文本中提取标题、链接和内容
  const handleSmartPaste = () => {
    navigator.clipboard?.readText().then(clipText => {
      if (!clipText || !clipText.trim()) {
        addToast({ icon: '⚠', title: '剪贴板为空' });
        return;
      }

      const text = clipText.trim();
      let parsedTitle = '';
      let parsedLink = '';
      let parsedContent = '';

      // 提取URL
      const urlRegex = /https?:\/\/[^\s<>"']+/g;
      const urls = text.match(urlRegex) || [];

      // 提取视频链接
      const videoUrl = urls.find(u =>
        u.includes('douyin.com') || u.includes('bilibili.com') ||
        u.includes('youtube.com') || u.includes('youtu.be') || u.includes('b23.tv')
      );

      if (videoUrl) {
        setVideoLink(videoUrl);
        setShowVideoSection(true);
      }

      // 第一个非视频URL作为文章链接
      const articleUrl = urls.find(u => u !== videoUrl);
      if (articleUrl) {
        parsedLink = articleUrl;
      }

      // 去掉URL后的纯文本
      const textWithoutUrls = text.replace(urlRegex, '').trim();

      // 按行分割
      const lines = textWithoutUrls.split(/\n/).map(l => l.trim()).filter(l => l);

      if (lines.length > 0) {
        // 第一行作为标题（如果标题为空）
        if (!title.trim()) {
          parsedTitle = lines[0].replace(/^#+\s*/, '').replace(/[*_`]/g, '').substring(0, 100);
        }
        // 其余作为内容
        if (lines.length > 1) {
          parsedContent = lines.slice(1).join('\n');
        }
      } else if (urls.length > 0 && !title.trim()) {
        // 只有URL没有文字
        parsedTitle = articleUrl || videoUrl || '链接收藏';
      }

      // 应用解析结果
      if (parsedTitle) setTitle(parsedTitle);
      if (parsedLink) setLink(parsedLink);
      if (parsedContent) {
        setContent(prev => prev ? prev + '\n\n' + parsedContent : parsedContent);
      }

      const parts: string[] = [];
      if (parsedTitle) parts.push('标题');
      if (parsedLink) parts.push('文章链接');
      if (videoUrl) parts.push('视频链接');
      if (parsedContent) parts.push('内容');
      addToast({ icon: '✓', title: `已解析${parts.join('、')}` });
    }).catch(() => {
      addToast({ icon: '⚠', title: '无法读取剪贴板' });
    });
  };

  // 处理内容粘贴时的自动检测
  const handleContentPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    const urlRegex = /https?:\/\/[^\s<>"']+/g;
    const urls = pasted.match(urlRegex) || [];

    if (urls.length > 0 && !link && !videoLink) {
      const firstUrl = urls[0];
      if (!firstUrl) return;

      e.preventDefault();
      const isVideo = firstUrl.includes('douyin.com') || firstUrl.includes('bilibili.com') ||
        firstUrl.includes('youtube.com') || firstUrl.includes('youtu.be');

      if (isVideo) {
        setVideoLink(firstUrl);
        setShowVideoSection(true);
      } else {
        setLink(firstUrl);
      }

      const textWithoutUrls = pasted.replace(urlRegex, '').trim();
      if (textWithoutUrls) {
        const target = e.currentTarget as HTMLTextAreaElement;
        const cursorPos = target.selectionStart || content.length;
        const before = content.substring(0, cursorPos);
        const after = content.substring(cursorPos);
        setContent(before + textWithoutUrls + after);
      }
      addToast({ icon: '✓', title: '自动提取链接' });
    }
  };

  // 生成视频文案
  const handleGenerateVideoNote = () => {
    setAiLoading(true);
    setTimeout(() => {
      const platform = getVideoPlatform(videoLink).name || '视频';
      const generated = generateVideoNote(title, videoNote, platform);
      setVideoNote(generated);
      setAiLoading(false);
      addToast({ icon: '✓', title: '视频文案已生成' });
    }, 600);
  };

  // AI 总结知识
  const handleSummarize = () => {
    setAiLoading(true);
    setShowSummary(true);
    setTimeout(() => {
      setAiLoading(false);
    }, 500);
  };

  const summary = (title || content) ? summarizeKnowledge(title, content, videoNote) : null;

  const handleSave = () => {
    // 至少需要有标题、内容、链接或视频链接之一
    if (!title.trim() && !content.trim() && !link.trim() && !videoLink.trim()) {
      addToast({ icon: '⚠', title: '请至少填写一项内容' });
      return;
    }

    let cleanLink = link.trim();
    if (cleanLink && !cleanLink.match(/^https?:\/\//)) {
      cleanLink = 'https://' + cleanLink;
    }
    let cleanVideoLink = videoLink.trim();
    if (cleanVideoLink && !cleanVideoLink.match(/^https?:\/\//)) {
      cleanVideoLink = 'https://' + cleanVideoLink;
    }

    const finalTitle = title.trim() || link.trim() || '未命名知识';

    if (isNew) {
      addKnowledge({
        title: finalTitle,
        content: content.trim(),
        categoryId: categoryId || null,
        link: cleanLink,
        videoLink: cleanVideoLink,
        videoNote: videoNote.trim(),
      });
      addToast({ icon: '★', title: '知识已创建', subtitle: '+5 经验值' });
    } else {
      updateKnowledge(id!, {
        title: finalTitle,
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
  const getVideoPlatform = (url: string): { name: string; embedUrl?: string; isDouyin?: boolean } => {
    if (!url) return { name: '' };
    if (url.includes('douyin.com') || url.includes('iesdouyin.com')) {
      const videoMatch = url.match(/video\/(\d+)/) || url.match(/\/v\/([^/?]+)/);
      if (videoMatch) {
        return { name: '抖音', embedUrl: `https://www.douyin.com/video/${videoMatch[1]}`, isDouyin: true };
      }
      return { name: '抖音', isDouyin: true };
    }
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
  const hasAnyContent = title.trim() || content.trim() || link.trim() || videoLink.trim();

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
        {/* 智能粘贴按钮 */}
        {isNew && (
          <button
            type="button"
            className="smart-paste-btn"
            onClick={handleSmartPaste}
          >
            <IconClipboard size={18} color="var(--color-primary)" />
            <span>智能粘贴</span>
            <span className="smart-paste-hint">自动解析标题、链接和内容</span>
          </button>
        )}

        <div className="form-group">
          <label className="form-label">标题</label>
          <input
            className="form-input"
            placeholder="输入标题（选填，可自动生成）"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <div className="content-header">
            <label className="form-label">内容</label>
            <button
              type="button"
              className="ai-action-btn"
              onClick={handleSummarize}
              disabled={aiLoading || !content.trim()}
            >
              <IconSparkles size={14} color="var(--color-primary)" />
              <span>AI 总结</span>
            </button>
          </div>
          <textarea
            ref={contentRef}
            className="form-textarea knowledge-textarea"
            placeholder="输入知识内容...或粘贴文字自动提取链接"
            value={content}
            onChange={e => setContent(e.target.value)}
            onPaste={handleContentPaste}
          />
        </div>

        {/* AI 总结面板 */}
        {showSummary && summary && (
          <div className="ai-summary-panel">
            <div className="ai-summary-header">
              <IconSparkles size={16} color="var(--color-primary)" />
              <span>AI 知识总结</span>
              <button className="ai-summary-close" onClick={() => setShowSummary(false)}>×</button>
            </div>

            <div className="ai-summary-section">
              <div className="ai-summary-section-title">📝 摘要</div>
              <p className="ai-summary-text">{summary.summary || '暂无内容可总结'}</p>
            </div>

            {summary.keyPoints.length > 0 && (
              <div className="ai-summary-section">
                <div className="ai-summary-section-title">🎯 核心要点</div>
                <ul className="ai-summary-list">
                  {summary.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}

            {summary.actionItems.length > 0 && (
              <div className="ai-summary-section">
                <div className="ai-summary-section-title">✅ 行动清单</div>
                <ul className="ai-summary-list action">
                  {summary.actionItems.map((item, i) => <li key={i}>☐ {item}</li>)}
                </ul>
              </div>
            )}

            {summary.keywords.length > 0 && (
              <div className="ai-summary-section">
                <div className="ai-summary-section-title">🏷️ 关键词</div>
                <div className="ai-summary-keywords">
                  {summary.keywords.map(k => (
                    <span key={k.word} className="ai-keyword-tag">#{k.word}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="ai-summary-actions">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  navigator.clipboard?.writeText(summary.structure);
                  addToast({ icon: '✓', title: '已复制到剪贴板' });
                }}
              >复制全文</button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setContent(prev => prev + '\n\n---\n' + summary.structure);
                  setShowSummary(false);
                  addToast({ icon: '✓', title: '已插入到内容中' });
                }}
              >插入到内容</button>
            </div>
          </div>
        )}

        {/* 文章链接 */}
        <div className="form-group">
          <label className="form-label">
            <IconLink size={16} color="var(--color-primary)" /> 文章链接
          </label>
          <input
            className="form-input"
            placeholder="粘贴链接（选填）"
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
                placeholder="支持 Bilibili / YouTube / 抖音"
                value={videoLink}
                onChange={e => setVideoLink(e.target.value)}
                type="url"
              />

              {videoLink && videoPlatform.embedUrl && (
                <div className="video-preview">
                  <iframe src={videoPlatform.embedUrl} title="视频预览" className="video-iframe" allowFullScreen scrolling="no" />
                </div>
              )}
              {videoLink && !videoPlatform.embedUrl && (
                <a href={videoLink} target="_blank" rel="noopener noreferrer" className="video-link-external">
                  <IconExternalLink size={14} color="var(--color-primary)" />
                  <span>打开视频</span>
                </a>
              )}

              <div className="video-note-header">
                <label className="form-label video-note-label">视频笔记 / 文案</label>
                <button type="button" className="ai-action-btn" onClick={handleGenerateVideoNote} disabled={aiLoading}>
                  <IconSparkles size={14} color="var(--color-primary)" />
                  <span>{aiLoading ? '生成中...' : '一键整理'}</span>
                </button>
              </div>
              <textarea
                className="form-textarea video-note-textarea"
                placeholder="记录视频要点或点击「一键整理」自动生成文案"
                value={videoNote}
                onChange={e => setVideoNote(e.target.value)}
              />
              <p className="video-note-hint">将视频中的关键内容整理为文字笔记</p>
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
          disabled={!hasAnyContent}
        >
          {isNew ? '创建' : '保存'}
        </button>

        <div className="task-form-actions">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>取消</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!hasAnyContent}>
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

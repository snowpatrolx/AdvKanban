import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, ANY_CATEGORY_ID } from '../store/useStore';
import { getCategoryName, getCategoryColor } from '../utils/taskHelpers';
import { IconBook, IconPlus, IconSearch, IconLink, IconVideo, IconSparkles } from '../components/common/Icons';
import './KnowledgePage.css';

export default function KnowledgePage() {
  const navigate = useNavigate();
  const { knowledge, categories } = useStore();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  const filtered = useMemo(() => {
    return knowledge
      .filter(k => !search || k.title.toLowerCase().includes(search.toLowerCase()) || k.content.toLowerCase().includes(search.toLowerCase()))
      .filter(k => {
        if (!filterCategory) return true;
        // any 分类的知识在所有分类筛选下都显示
        if (filterCategory !== ANY_CATEGORY_ID && k.categoryId === ANY_CATEGORY_ID) return true;
        return k.categoryId === filterCategory;
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [knowledge, search, filterCategory]);

  // AI 分析数据
  const analysis = useMemo(() => {
    if (knowledge.length === 0) return null;

    const realCategories = categories.filter(c => c.id !== ANY_CATEGORY_ID);
    const byCategory = realCategories.map(c => ({
      name: c.name,
      color: c.color,
      count: knowledge.filter(k => k.categoryId === c.id).length,
    })).sort((a, b) => b.count - a.count);

    const uncatCount = knowledge.filter(k => !k.categoryId).length;
    const withVideo = knowledge.filter(k => k.videoLink).length;
    const withLink = knowledge.filter(k => k.link).length;
    const withVideoNote = knowledge.filter(k => k.videoNote && k.videoNote.trim()).length;
    const totalWords = knowledge.reduce((sum, k) => sum + (k.content.length + (k.videoNote?.length || 0)), 0);

    // 关键词提取（简单频率统计）
    const allText = knowledge.map(k => k.title + ' ' + k.content).join(' ');
    const stopWords = new Set(['的', '了', '是', '在', '和', '与', '或', '一个', '可以', '使用', '通过', '进行', '这个', 'that', 'the', 'a', 'an', 'to', 'is', 'in', 'for', 'of', 'and', 'or']);
    const words = allText
      .replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !stopWords.has(w.toLowerCase()));
    const wordFreq: Record<string, number> = {};
    words.forEach(w => {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    });
    const topKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word, count]) => ({ word, count }));

    // 最近更新
    const recent = [...knowledge]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5);

    // 建议缺失分类
    const emptyCategories = byCategory.filter(c => c.count === 0).map(c => c.name);
    const maxCat = byCategory[0];

    return {
      total: knowledge.length,
      byCategory,
      uncatCount,
      withVideo,
      withLink,
      withVideoNote,
      totalWords,
      topKeywords,
      recent,
      emptyCategories,
      maxCat,
    };
  }, [knowledge, categories]);

  return (
    <div className="page knowledge-page">
      <div className="page-header">
        <h1 className="page-title">知识库</h1>
        <div className="knowledge-header-actions">
          <button
            className="btn btn-secondary btn-sm knowledge-analysis-btn"
            onClick={() => setShowAnalysis(!showAnalysis)}
          >
            <IconSparkles size={16} color="var(--color-primary)" />
          </button>
          <button className="btn btn-primary btn-sm knowledge-new-btn" onClick={() => navigate('/knowledge/new')}>
            <IconPlus size={16} color="#fff" /> 新建
          </button>
        </div>
      </div>

      {/* AI 分析面板 */}
      {showAnalysis && analysis && (
        <div className="knowledge-analysis-panel">
          <div className="ka-header">
            <IconSparkles size={16} color="var(--color-primary)" />
            <span>知识库分析</span>
          </div>

          {/* 总览 */}
          <div className="ka-overview">
            <div className="ka-stat">
              <span className="ka-stat-num">{analysis.total}</span>
              <span className="ka-stat-label">知识条目</span>
            </div>
            <div className="ka-stat">
              <span className="ka-stat-num">{analysis.totalWords}</span>
              <span className="ka-stat-label">总字数</span>
            </div>
            <div className="ka-stat">
              <span className="ka-stat-num">{analysis.withVideo}</span>
              <span className="ka-stat-label">视频</span>
            </div>
            <div className="ka-stat">
              <span className="ka-stat-num">{analysis.withLink}</span>
              <span className="ka-stat-label">链接</span>
            </div>
          </div>

          {/* 分类分布 */}
          {analysis.byCategory.length > 0 && (
            <div className="ka-section">
              <div className="ka-section-title">分类分布</div>
              <div className="ka-category-bars">
                {analysis.byCategory.map(c => (
                  <div key={c.name} className="ka-category-bar-row">
                    <span className="ka-cat-dot" style={{ background: c.color }} />
                    <span className="ka-cat-name">{c.name}</span>
                    <div className="ka-cat-bar">
                      <div
                        className="ka-cat-fill"
                        style={{
                          width: `${analysis.total > 0 ? (c.count / analysis.total) * 100 : 0}%`,
                          background: c.color,
                        }}
                      />
                    </div>
                    <span className="ka-cat-count">{c.count}</span>
                  </div>
                ))}
                {analysis.uncatCount > 0 && (
                  <div className="ka-category-bar-row">
                    <span className="ka-cat-dot" style={{ background: '#ddd' }} />
                    <span className="ka-cat-name">未分类</span>
                    <div className="ka-cat-bar">
                      <div
                        className="ka-cat-fill"
                        style={{
                          width: `${(analysis.uncatCount / analysis.total) * 100}%`,
                          background: '#ddd',
                        }}
                      />
                    </div>
                    <span className="ka-cat-count">{analysis.uncatCount}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 关键词 */}
          {analysis.topKeywords.length > 0 && (
            <div className="ka-section">
              <div className="ka-section-title">高频关键词</div>
              <div className="ka-keywords">
                {analysis.topKeywords.map(k => (
                  <span key={k.word} className="ka-keyword" style={{ fontSize: `${12 + Math.min(k.count, 8)}px` }}>
                    {k.word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 智能建议 */}
          <div className="ka-section">
            <div className="ka-section-title">智能建议</div>
            <div className="ka-suggestions">
              {analysis.emptyCategories.length > 0 && (
                <div className="ka-suggestion">
                  <span className="ka-suggestion-icon">○</span>
                  <span>「{analysis.emptyCategories.join('、')}」分类暂无知识，可以补充</span>
                </div>
              )}
              {analysis.maxCat && analysis.maxCat.count > analysis.total * 0.5 && analysis.total > 4 && (
                <div className="ka-suggestion">
                  <span className="ka-suggestion-icon">○</span>
                  <span>知识集中在「{analysis.maxCat.name}」，建议丰富其他分类</span>
                </div>
              )}
              {analysis.uncatCount > 0 && (
                <div className="ka-suggestion">
                  <span className="ka-suggestion-icon">○</span>
                  <span>{analysis.uncatCount} 条知识未分类，建议归类以便管理</span>
                </div>
              )}
              {analysis.withVideoNote < analysis.withVideo && (
                <div className="ka-suggestion">
                  <span className="ka-suggestion-icon">○</span>
                  <span>{analysis.withVideo - analysis.withVideoNote} 个视频尚未整理笔记</span>
                </div>
              )}
              {analysis.total < 5 && (
                <div className="ka-suggestion">
                  <span className="ka-suggestion-icon">○</span>
                  <span>知识库还较少，每条知识可获 +5 经验值</span>
                </div>
              )}
            </div>
          </div>

          {/* 最近更新 */}
          {analysis.recent.length > 0 && (
            <div className="ka-section">
              <div className="ka-section-title">最近更新</div>
              <div className="ka-recent-list">
                {analysis.recent.map(k => (
                  <div key={k.id} className="ka-recent-item" onClick={() => navigate(`/knowledge/${k.id}`)}>
                    <span className="ka-recent-title">{k.title}</span>
                    <span className="ka-recent-date">{new Date(k.updatedAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="home-search-bar">
        <div className="hk-search-wrap">
          <IconSearch size={18} color="var(--color-text-light)" className="hk-search-icon" />
          <input
            className="form-input hk-search-input"
            placeholder="搜索知识..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="home-category-filter">
        <button
          className={`category-chip ${!filterCategory ? 'active' : ''}`}
          onClick={() => setFilterCategory('')}
        >全部</button>
        {categories.map(c => (
          <button
            key={c.id}
            className={`category-chip ${filterCategory === c.id ? 'active' : ''}`}
            style={filterCategory === c.id ? { background: c.color, color: '#fff' } : {}}
            onClick={() => setFilterCategory(c.id)}
          >
            <span className="category-dot" style={{ background: c.color }} />
            {c.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon-flat">
            <IconBook size={48} color="var(--color-text-light)" />
          </div>
          <p>{search ? '未找到匹配的知识' : '点击右上角创建第一条知识'}</p>
        </div>
      ) : (
        <div className="knowledge-list">
          {filtered.map(k => {
            const catName = getCategoryName(categories, k.categoryId);
            const catColor = getCategoryColor(categories, k.categoryId);
            return (
              <div key={k.id} className="knowledge-card" onClick={() => navigate(`/knowledge/${k.id}`)}>
                <div className="knowledge-card-title">
                  {k.title}
                  <div className="knowledge-card-icons">
                    {k.videoLink && <IconVideo size={14} color="var(--color-primary)" />}
                    {k.link && <IconLink size={14} color="var(--color-primary)" />}
                  </div>
                </div>
                <div className="knowledge-card-preview">
                  {k.content.replace(/[#*`>\-]/g, '').substring(0, 60)}
                  {k.content.length > 60 ? '...' : ''}
                </div>
                {k.videoNote && k.videoNote.trim() && (
                  <div className="knowledge-card-video-note">
                    <IconVideo size={12} color="var(--color-text-light)" />
                    <span>{k.videoNote.substring(0, 40)}{k.videoNote.length > 40 ? '...' : ''}</span>
                  </div>
                )}
                <div className="knowledge-card-meta">
                  {catName && (
                    <span className="tag" style={{ background: catColor + '22', color: catColor }}>{catName}</span>
                  )}
                  <span className="knowledge-card-date">
                    {new Date(k.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button className="fab" onClick={() => navigate('/knowledge/new')}>
        <IconPlus size={26} color="#fff" />
      </button>
    </div>
  );
}

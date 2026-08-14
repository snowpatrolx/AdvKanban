import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getCategoryName, getCategoryColor } from '../utils/taskHelpers';
import { IconBook, IconPlus, IconSearch, IconLink } from '../components/common/Icons';
import './KnowledgePage.css';

export default function KnowledgePage() {
  const navigate = useNavigate();
  const { knowledge, categories } = useStore();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const filtered = useMemo(() => {
    return knowledge
      .filter(k => !search || k.title.toLowerCase().includes(search.toLowerCase()) || k.content.toLowerCase().includes(search.toLowerCase()))
      .filter(k => !filterCategory || k.categoryId === filterCategory)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [knowledge, search, filterCategory]);

  return (
    <div className="page knowledge-page">
      <div className="page-header">
        <h1 className="page-title">知识库</h1>
        <button className="btn btn-primary btn-sm knowledge-new-btn" onClick={() => navigate('/knowledge/new')}>
          <IconPlus size={16} color="#fff" /> 新建
        </button>
      </div>

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
                  {k.link && <IconLink size={14} color="var(--color-primary)" className="knowledge-link-icon" />}
                </div>
                <div className="knowledge-card-preview">
                  {k.content.replace(/[#*`>\-]/g, '').substring(0, 60)}
                  {k.content.length > 60 ? '...' : ''}
                </div>
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

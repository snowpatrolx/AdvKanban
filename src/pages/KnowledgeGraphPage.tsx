import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, ANY_CATEGORY_ID } from '../store/useStore';
import { getCategoryColor, getCategoryName } from '../utils/taskHelpers';
import { extractKeywords } from '../utils/aiSummary';
import { IconBack, IconZoomIn, IconZoomOut, IconRefresh, IconInfo } from '../components/common/Icons';
import './KnowledgeGraphPage.css';

interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  categoryId: string | null;
  keywords: string[];
}

interface GraphLink {
  source: string;
  target: string;
  strength: number;
}

const WIDTH = 800;
const HEIGHT = 600;
const NODE_RADIUS_BASE = 18;
const NODE_RADIUS_MAX = 36;

export default function KnowledgeGraphPage() {
  const navigate = useNavigate();
  const { knowledge, categories } = useStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showInfo, setShowInfo] = useState(true);

  // 构建图谱数据
  const graphData = useMemo(() => {
    if (knowledge.length === 0) return { nodes: [], links: [] };

    // 为每个知识条目提取关键词
    const knowledgeWithKeywords = knowledge.map(k => {
      const text = k.title + ' ' + k.content;
      const keywords = extractKeywords(text, 8).map((kw: { word: string; count: number }) => kw.word);
      return { ...k, keywords };
    });

    // 计算节点大小（基于内容长度和关键词数量）
    const maxContentLen = Math.max(...knowledgeWithKeywords.map(k => k.content.length), 100);

    const graphNodes: GraphNode[] = knowledgeWithKeywords.map((k, i) => {
      const catColor = getCategoryColor(categories, k.categoryId) || '#6c5ce7';
      const sizeRatio = Math.min(k.content.length / maxContentLen, 1);
      const radius = NODE_RADIUS_BASE + sizeRatio * (NODE_RADIUS_MAX - NODE_RADIUS_BASE);

      // 初始位置：环形分布
      const angle = (i / knowledgeWithKeywords.length) * Math.PI * 2;
      const radius_ring = Math.min(WIDTH, HEIGHT) * 0.35;

      return {
        id: k.id,
        title: k.title,
        x: WIDTH / 2 + Math.cos(angle) * radius_ring,
        y: HEIGHT / 2 + Math.sin(angle) * radius_ring,
        vx: 0,
        vy: 0,
        radius,
        color: catColor,
        categoryId: k.categoryId,
        keywords: k.keywords,
      };
    });

    // 计算节点之间的连接（基于关键词重叠）
    const graphLinks: GraphLink[] = [];
    const keywordToNodes: Record<string, string[]> = {};

    graphNodes.forEach(node => {
      node.keywords.forEach(kw => {
        if (!keywordToNodes[kw]) keywordToNodes[kw] = [];
        keywordToNodes[kw].push(node.id);
      });
    });

    // 计算每对节点之间的关键词重叠数量
    for (let i = 0; i < graphNodes.length; i++) {
      for (let j = i + 1; j < graphNodes.length; j++) {
        const nodeA = graphNodes[i];
        const nodeB = graphNodes[j];
        const commonKeywords = nodeA.keywords.filter(kw => nodeB.keywords.includes(kw));
        const strength = commonKeywords.length;

        if (strength > 0) {
          graphLinks.push({
            source: nodeA.id,
            target: nodeB.id,
            strength,
          });
        }
      }
    }

    // 只保留最强的一些连接，避免过于密集
    const maxLinks = Math.min(graphLinks.length, knowledge.length * 2);
    graphLinks.sort((a, b) => b.strength - a.strength);
    const topLinks = graphLinks.slice(0, maxLinks);

    return { nodes: graphNodes, links: topLinks };
  }, [knowledge, categories]);

  // 初始化图谱
  useEffect(() => {
    nodesRef.current = graphData.nodes.map(n => ({ ...n }));
    linksRef.current = [...graphData.links];
    setNodes([...nodesRef.current]);
    setLinks([...linksRef.current]);
  }, [graphData]);

  // 力导向模拟
  const tick = useCallback(() => {
    const currentNodes = nodesRef.current;
    const currentLinks = linksRef.current;

    if (currentNodes.length === 0) return;

    const nodeMap = new Map(currentNodes.map(n => [n.id, n]));

    // 1. 斥力（节点之间）
    const repulsionStrength = 5000;
    for (let i = 0; i < currentNodes.length; i++) {
      for (let j = i + 1; j < currentNodes.length; j++) {
        const dx = currentNodes[j].x - currentNodes[i].x;
        const dy = currentNodes[j].y - currentNodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsionStrength / (dist * dist);

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        currentNodes[i].vx -= fx;
        currentNodes[i].vy -= fy;
        currentNodes[j].vx += fx;
        currentNodes[j].vy += fy;
      }
    }

    // 2. 吸引力（连线节点）
    const attractionStrength = 0.02;
    currentLinks.forEach(link => {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = dist * attractionStrength * link.strength;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    });

    // 3. 中心引力
    const centerStrength = 0.01;
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;
    currentNodes.forEach(node => {
      node.vx += (centerX - node.x) * centerStrength;
      node.vy += (centerY - node.y) * centerStrength;
    });

    // 4. 速度衰减
    const damping = 0.9;
    currentNodes.forEach(node => {
      node.vx *= damping;
      node.vy *= damping;
    });

    // 5. 更新位置
    currentNodes.forEach(node => {
      node.x += node.vx;
      node.y += node.vy;

      // 边界限制
      const margin = node.radius + 10;
      node.x = Math.max(margin, Math.min(WIDTH - margin, node.x));
      node.y = Math.max(margin, Math.min(HEIGHT - margin, node.y));
    });

    setNodes([...currentNodes]);
    animationRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (nodes.length > 0) {
      animationRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes.length, tick]);

  // 缩放控制
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    // 重置节点位置
    nodesRef.current = graphData.nodes.map((n, i) => {
      const angle = (i / graphData.nodes.length) * Math.PI * 2;
      const radius_ring = Math.min(WIDTH, HEIGHT) * 0.35;
      return {
        ...n,
        x: WIDTH / 2 + Math.cos(angle) * radius_ring,
        y: HEIGHT / 2 + Math.sin(angle) * radius_ring,
        vx: 0,
        vy: 0,
      };
    });
    setNodes([...nodesRef.current]);
  };

  // 拖拽平移
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest('.graph-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 触摸支持
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 获取与hover节点相关的连线
  const getRelatedLinks = useCallback((nodeId: string | null) => {
    if (!nodeId) return new Set<string>();
    return new Set(
      links
        .filter(l => l.source === nodeId || l.target === nodeId)
        .map(l => `${l.source}-${l.target}`)
    );
  }, [links]);

  // 获取与hover节点相关的节点
  const getRelatedNodes = useCallback((nodeId: string | null) => {
    if (!nodeId) return new Set<string>();
    const related = new Set<string>([nodeId]);
    links.forEach(l => {
      if (l.source === nodeId) related.add(l.target);
      if (l.target === nodeId) related.add(l.source);
    });
    return related;
  }, [links]);

  const relatedLinks = getRelatedLinks(hoveredNode);
  const relatedNodes = getRelatedNodes(hoveredNode);

  // 统计数据
  const stats = useMemo(() => {
    const realCategories = categories.filter(c => c.id !== ANY_CATEGORY_ID);
    const byCategory = realCategories.map(c => ({
      name: c.name,
      color: c.color,
      count: knowledge.filter(k => k.categoryId === c.id).length,
    })).filter(c => c.count > 0);

    return {
      totalNodes: knowledge.length,
      totalLinks: links.length,
      byCategory,
    };
  }, [knowledge, categories, links.length]);

  if (knowledge.length === 0) {
    return (
      <div className="page knowledge-graph-page">
        <div className="page-header">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <IconBack size={18} color="var(--color-text)" />
          </button>
          <h1 className="page-title">知识图谱</h1>
          <div style={{ width: 36 }} />
        </div>
        <div className="empty-state">
          <div className="empty-state-icon-flat">
            <IconInfo size={48} color="var(--color-text-light)" />
          </div>
          <p>知识库暂无内容，先去创建一些知识吧</p>
          <button className="btn btn-primary" onClick={() => navigate('/knowledge/new')}>
            创建知识
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page knowledge-graph-page" ref={containerRef}>
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <IconBack size={18} color="var(--color-text)" />
        </button>
        <h1 className="page-title">知识图谱</h1>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowInfo(!showInfo)}
        >
          <IconInfo size={18} color="var(--color-text)" />
        </button>
      </div>

      {/* 信息面板 */}
      {showInfo && (
        <div className="graph-info-panel">
          <div className="graph-stats">
            <div className="graph-stat">
              <span className="graph-stat-num">{stats.totalNodes}</span>
              <span className="graph-stat-label">知识节点</span>
            </div>
            <div className="graph-stat">
              <span className="graph-stat-num">{stats.totalLinks}</span>
              <span className="graph-stat-label">关联连线</span>
            </div>
          </div>
          {stats.byCategory.length > 0 && (
            <div className="graph-legend">
              <div className="graph-legend-title">分类图例</div>
              <div className="graph-legend-items">
                {stats.byCategory.map(c => (
                  <div key={c.name} className="graph-legend-item">
                    <span className="graph-legend-dot" style={{ background: c.color }} />
                    <span className="graph-legend-name">{c.name}</span>
                    <span className="graph-legend-count">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="graph-tip">
            <span>💡 拖拽移动视角 · 点击节点查看详情</span>
          </div>
        </div>
      )}

      {/* 图谱容器 */}
      <div
        className="graph-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          {/* 背景网格 */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="0.5"
                opacity="0.5"
              />
            </pattern>
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
            </filter>
          </defs>
          <rect width={WIDTH} height={HEIGHT} fill="url(#grid)" />

          {/* 连线 */}
          <g className="graph-links">
            {links.map(link => {
              const source = nodes.find(n => n.id === link.source);
              const target = nodes.find(n => n.id === link.target);
              if (!source || !target) return null;

              const linkKey = `${link.source}-${link.target}`;
              const isHighlighted = hoveredNode && relatedLinks.has(linkKey);
              const isDimmed = hoveredNode && !relatedLinks.has(linkKey);

              return (
                <line
                  key={linkKey}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="var(--color-primary)"
                  strokeWidth={isHighlighted ? 2 + link.strength : 0.5 + link.strength * 0.3}
                  opacity={isDimmed ? 0.1 : isHighlighted ? 0.8 : 0.3}
                  style={{ transition: 'opacity 0.2s, stroke-width 0.2s' }}
                />
              );
            })}
          </g>

          {/* 节点 */}
          <g className="graph-nodes">
            {nodes.map(node => {
              const isHovered = hoveredNode === node.id;
              const isRelated = hoveredNode && relatedNodes.has(node.id);
              const isDimmed = hoveredNode && !isRelated;

              return (
                <g
                  key={node.id}
                  className="graph-node"
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => navigate(`/knowledge/${node.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* 光晕效果 */}
                  {isHovered && (
                    <circle
                      r={node.radius + 8}
                      fill={node.color}
                      opacity="0.2"
                    />
                  )}

                  {/* 节点主体 */}
                  <circle
                    r={node.radius}
                    fill={node.color}
                    stroke="#fff"
                    strokeWidth="2"
                    filter="url(#shadow)"
                    opacity={isDimmed ? 0.3 : 1}
                    style={{ transition: 'opacity 0.2s, r 0.2s' }}
                  />

                  {/* 节点文字（只在hover或大节点显示） */}
                  {(isHovered || node.radius > 28) && (
                    <>
                      <text
                        textAnchor="middle"
                        dy="0.35em"
                        fill="#fff"
                        fontSize={Math.min(11, node.radius / 3)}
                        fontWeight="600"
                        style={{ pointerEvents: 'none' }}
                      >
                        {node.title.length > 6 ? node.title.substring(0, 6) + '...' : node.title}
                      </text>
                    </>
                  )}

                  {/* 悬浮提示 */}
                  {isHovered && (
                    <g transform={`translate(0, ${-node.radius - 12})`}>
                      <rect
                        x={-node.title.length * 6 - 8}
                        y={-16}
                        width={node.title.length * 12 + 16}
                        height="24"
                        rx="4"
                        fill="rgba(0,0,0,0.8)"
                      />
                      <text
                        textAnchor="middle"
                        dy="0"
                        fill="#fff"
                        fontSize="12"
                        style={{ pointerEvents: 'none' }}
                      >
                        {node.title}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* 控制按钮 */}
      <div className="graph-controls">
        <button className="graph-control-btn" onClick={handleZoomIn} title="放大">
          <IconZoomIn size={20} color="var(--color-text)" />
        </button>
        <button className="graph-control-btn" onClick={handleZoomOut} title="缩小">
          <IconZoomOut size={20} color="var(--color-text)" />
        </button>
        <button className="graph-control-btn" onClick={handleReset} title="重置">
          <IconRefresh size={20} color="var(--color-text)" />
        </button>
      </div>
    </div>
  );
}

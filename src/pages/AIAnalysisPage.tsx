import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, ANY_CATEGORY_ID } from '../store/useStore';
import { getLevelProgress } from '../utils/gamification';
import { CHAPTERS } from '../data/chapters';
import { BADGES } from '../data/badges';
import {
  IconAI, IconFlame, IconTrophy, IconWarning, IconArrowRight,
  IconCheckCircle, IconBook, IconSword, IconStar, IconChart,
} from '../components/common/Icons';
import './AIAnalysisPage.css';

interface Insight {
  type: 'urgent' | 'warning' | 'tip' | 'good';
  icon: React.ReactNode;
  title: string;
  desc: string;
  action?: { label: string; path: string };
}

export default function AIAnalysisPage() {
  const navigate = useNavigate();
  const { tasks, categories, knowledge, userProfile, userBadges, storyProgress, dailyRecords } = useStore();

  const levelInfo = getLevelProgress(userProfile.totalPoints);
  const todayStr = new Date().toISOString().substring(0, 10);
  const pendingTasks = tasks.filter(t => t.status !== 'done' && !t.parentId);
  const todoTasks = pendingTasks.filter(t => t.status === 'todo');
  const doingTasks = pendingTasks.filter(t => t.status === 'doing');
  const overdueTasks = pendingTasks.filter(t => t.dueDate && t.dueDate < todayStr);
  const highPriorityPending = pendingTasks.filter(t => t.priority === 'high');
  const currentChapter = CHAPTERS.find(c => c.id === storyProgress.currentChapter);
  const earnedBadges = BADGES.filter(b => userBadges.includes(b.id));
  const lockedBadges = BADGES.filter(b => !userBadges.includes(b.id));

  // 7天趋势数据
  const weekData = useMemo(() => {
    const days: { date: string; label: string; count: number; points: number }[] = [];
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      const record = dailyRecords.find(r => r.date === dateStr);
      days.push({
        date: dateStr,
        label: dayNames[d.getDay()],
        count: record?.completedCount || 0,
        points: record?.pointsEarned || 0,
      });
    }
    return days;
  }, [dailyRecords]);

  const weekTotal = weekData.reduce((sum, d) => sum + d.count, 0);
  const weekPoints = weekData.reduce((sum, d) => sum + d.points, 0);
  const maxDayCount = Math.max(...weekData.map(d => d.count), 1);

  // 分类分布
  const categoryStats = useMemo(() => {
    return categories
      .filter(c => c.id !== ANY_CATEGORY_ID)
      .map(c => ({
        ...c,
        pending: tasks.filter(t => t.categoryId === c.id && t.status !== 'done' && !t.parentId).length,
        done: tasks.filter(t => t.categoryId === c.id && t.status === 'done' && !t.parentId).length,
      }));
  }, [categories, tasks]);

  const totalDone = categoryStats.reduce((sum, c) => sum + c.done, 0);

  // 智能洞察
  const insights = useMemo(() => {
    const list: Insight[] = [];

    // 逾期任务 - 紧急
    if (overdueTasks.length > 0) {
      list.push({
        type: 'urgent',
        icon: <IconWarning size={18} color="#e74c3c" />,
        title: `${overdueTasks.length} 个任务已逾期`,
        desc: overdueTasks.slice(0, 2).map(t => `「${t.title}」`).join('、') + (overdueTasks.length > 2 ? '...' : ''),
        action: { label: '去处理', path: '/' },
      });
    }

    // 连胜中断风险
    if (userProfile.currentStreak === 0 && pendingTasks.length > 0) {
      list.push({
        type: 'warning',
        icon: <IconFlame size={18} color="#e17055" />,
        title: '连胜已中断',
        desc: '今天完成一个任务即可重新开启连胜',
        action: { label: '去做任务', path: '/' },
      });
    } else if (userProfile.currentStreak > 0 && userProfile.currentStreak < 3) {
      list.push({
        type: 'tip',
        icon: <IconFlame size={18} color="#e17055" />,
        title: `连胜 ${userProfile.currentStreak} 天`,
        desc: `再坚持 ${3 - userProfile.currentStreak} 天获得「连续三天」徽章`,
      });
    }

    // 高优先级任务
    if (highPriorityPending.length > 0) {
      list.push({
        type: 'tip',
        icon: <IconStar size={18} color="#f39c12" />,
        title: `${highPriorityPending.length} 个高优先级任务`,
        desc: '完成后获双倍经验（+20）',
        action: { label: '查看', path: '/' },
      });
    }

    // 进行中任务过多
    if (doingTasks.length > 3) {
      list.push({
        type: 'warning',
        icon: <IconWarning size={18} color="#e67e22" />,
        title: `进行中任务较多（${doingTasks.length}个）`,
        desc: '建议聚焦完成，避免分散注意力',
      });
    }

    // Boss 攻击建议
    if (currentChapter?.bossName) {
      const bossHP = storyProgress.bossCurrentHP[currentChapter.id] ?? currentChapter.bossHP;
      if (bossHP > 0) {
        const attacksNeeded = Math.ceil(bossHP / 15);
        list.push({
          type: 'tip',
          icon: <IconSword size={18} color="#8e44ad" />,
          title: `Boss「${currentChapter.bossName}」剩余 ${bossHP} HP`,
          desc: `约需完成 ${attacksNeeded} 个任务可击败`,
          action: { label: '去战斗', path: '/' },
        });
      }
    }

    // 知识库偏少
    if (knowledge.length < 5) {
      list.push({
        type: 'tip',
        icon: <IconBook size={18} color="#6c5ce7" />,
        title: `知识库仅 ${knowledge.length} 条`,
        desc: '创建知识可获 +5 经验并推进冒险',
        action: { label: '去创建', path: '/knowledge' },
      });
    }

    // 正面反馈
    if (list.length === 0 || (overdueTasks.length === 0 && userProfile.currentStreak >= 3)) {
      list.push({
        type: 'good',
        icon: <IconCheckCircle size={18} color="#00b894" />,
        title: '状态良好！',
        desc: '没有逾期任务，继续保持',
      });
    }

    return list.slice(0, 5);
  }, [overdueTasks, doingTasks, highPriorityPending, userProfile, currentChapter, storyProgress, knowledge, pendingTasks]);

  // 下一个徽章
  const nextBadge = lockedBadges[0];

  // 今日数据
  const todayRecord = dailyRecords.find(r => r.date === todayStr);

  return (
    <div className="page ai-dashboard">
      {/* 头部 */}
      <div className="ai-header">
        <div className="ai-header-icon">
          <IconAI size={24} color="#fff" />
        </div>
        <div>
          <h1 className="ai-title">智能分析</h1>
          <p className="ai-subtitle">基于你的数据自动生成洞察</p>
        </div>
      </div>

      <div className="ai-content">
        {/* 智能洞察 */}
        <section className="ai-section">
          <h2 className="ai-section-title">
            <IconAI size={16} color="var(--color-primary)" />
            智能洞察
          </h2>
          <div className="ai-insights">
            {insights.map((insight, i) => (
              <div key={i} className={`ai-insight-card ai-insight-${insight.type}`}>
                <div className="ai-insight-icon">{insight.icon}</div>
                <div className="ai-insight-body">
                  <div className="ai-insight-title">{insight.title}</div>
                  <div className="ai-insight-desc">{insight.desc}</div>
                </div>
                {insight.action && (
                  <button
                    className="ai-insight-action"
                    onClick={() => navigate(insight.action!.path)}
                  >
                    {insight.action.label}
                    <IconArrowRight size={14} color="var(--color-primary)" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 等级进度 */}
        <section className="ai-section">
          <h2 className="ai-section-title">
            <IconTrophy size={16} color="#fdcb6e" />
            等级进度
          </h2>
          <div className="ai-level-card">
            <div className="ai-level-header">
              <span className="ai-level-badge">Lv.{levelInfo.level}</span>
              <span className="ai-level-name">{levelInfo.name}</span>
              <span className="ai-level-points">{userProfile.totalPoints} EXP</span>
            </div>
            <div className="ai-progress-bar">
              <div className="ai-progress-fill" style={{ width: `${levelInfo.progress}%` }} />
            </div>
            <div className="ai-level-detail">
              {levelInfo.pointsToNext !== null ? (
                <span>距 Lv.{levelInfo.level + 1} 还需 {levelInfo.pointsToNext} EXP</span>
              ) : (
                <span>已达最高等级</span>
              )}
            </div>
          </div>
        </section>

        {/* 7天趋势 */}
        <section className="ai-section">
          <h2 className="ai-section-title">
            <IconChart size={16} color="#00b894" />
            近7天趋势
          </h2>
          <div className="ai-trend-card">
            <div className="ai-trend-stats">
              <div className="ai-trend-stat">
                <span className="ai-trend-stat-value">{weekTotal}</span>
                <span className="ai-trend-stat-label">完成</span>
              </div>
              <div className="ai-trend-stat">
                <span className="ai-trend-stat-value">{weekPoints}</span>
                <span className="ai-trend-stat-label">经验</span>
              </div>
              <div className="ai-trend-stat">
                <span className="ai-trend-stat-value">{userProfile.currentStreak}</span>
                <span className="ai-trend-stat-label">连胜</span>
              </div>
            </div>
            <div className="ai-bar-chart">
              {weekData.map((d, i) => (
                <div key={i} className="ai-bar-col">
                  <div className="ai-bar-wrapper">
                    <div
                      className={`ai-bar ${d.count > 0 ? 'active' : ''} ${d.date === todayStr ? 'today' : ''}`}
                      style={{ height: `${(d.count / maxDayCount) * 100}%` }}
                    >
                      <span className="ai-bar-value">{d.count > 0 ? d.count : ''}</span>
                    </div>
                  </div>
                  <span className={`ai-bar-label ${d.date === todayStr ? 'today' : ''}`}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 任务概览 */}
        <section className="ai-section">
          <h2 className="ai-section-title">
            <IconCheckCircle size={16} color="#0984e3" />
            任务概览
          </h2>
          <div className="ai-task-grid">
            <div className="ai-task-stat ai-stat-todo">
              <span className="ai-task-stat-num">{todoTasks.length}</span>
              <span className="ai-task-stat-label">待办</span>
            </div>
            <div className="ai-task-stat ai-stat-doing">
              <span className="ai-task-stat-num">{doingTasks.length}</span>
              <span className="ai-task-stat-label">进行中</span>
            </div>
            <div className="ai-task-stat ai-stat-done">
              <span className="ai-task-stat-num">{userProfile.completedTaskCount}</span>
              <span className="ai-task-stat-label">已完成</span>
            </div>
            <div className="ai-task-stat ai-stat-overdue">
              <span className="ai-task-stat-num">{overdueTasks.length}</span>
              <span className="ai-task-stat-label">逾期</span>
            </div>
          </div>
        </section>

        {/* 分类分布 */}
        {totalDone > 0 && (
          <section className="ai-section">
            <h2 className="ai-section-title">
              <IconChart size={16} color="#6c5ce7" />
              分类完成情况
            </h2>
            <div className="ai-category-card">
              {categoryStats.map(c => {
                const total = c.pending + c.done;
                const pct = total > 0 ? Math.round((c.done / total) * 100) : 0;
                return (
                  <div key={c.id} className="ai-category-row">
                    <span className="ai-category-dot" style={{ background: c.color }} />
                    <span className="ai-category-name">{c.name}</span>
                    <div className="ai-category-bar">
                      <div className="ai-category-fill" style={{ width: `${pct}%`, background: c.color }} />
                    </div>
                    <span className="ai-category-pct">{c.done}/{total}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 冒险进度 */}
        {currentChapter && (
          <section className="ai-section">
            <h2 className="ai-section-title">
              <IconSword size={16} color="#8e44ad" />
              冒险进度
            </h2>
            <div className="ai-adventure-card">
              <div className="ai-adventure-header">
                <span className="ai-adventure-chapter">第 {storyProgress.currentChapter} 章</span>
                <span className="ai-adventure-title">{currentChapter.title}</span>
              </div>
              <div className="ai-adventure-area">{currentChapter.area}</div>
              {currentChapter.bossName && (
                <>
                  <div className="ai-boss-info">
                    <span className="ai-boss-name">{currentChapter.bossName}</span>
                    {(() => {
                      const bossHP = storyProgress.bossCurrentHP[currentChapter.id] ?? currentChapter.bossHP;
                      const pct = ((currentChapter.bossHP - bossHP) / currentChapter.bossHP) * 100;
                      return (
                        <>
                          <div className="ai-boss-hp-bar">
                            <div className="ai-boss-hp-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="ai-boss-hp-text">{bossHP} / {currentChapter.bossHP} HP</span>
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
              <div className="ai-adventure-progress">
                已解锁 {storyProgress.unlockedChapters.length}/{CHAPTERS.length} 章节 · 击败 {storyProgress.defeatedBosses.length} 个 Boss
              </div>
            </div>
          </section>
        )}

        {/* 徽章进度 */}
        <section className="ai-section">
          <h2 className="ai-section-title">
            <IconStar size={16} color="#f39c12" />
            徽章进度
          </h2>
          <div className="ai-badge-card">
            <div className="ai-badge-progress">
              <span className="ai-badge-count">{earnedBadges.length}<small>/{BADGES.length}</small></span>
              <div className="ai-badge-bar">
                <div className="ai-badge-fill" style={{ width: `${(earnedBadges.length / BADGES.length) * 100}%` }} />
              </div>
            </div>
            {nextBadge && (
              <div className="ai-badge-next">
                <span className="ai-badge-next-label">下一个目标</span>
                <span className="ai-badge-next-name">{nextBadge.name}</span>
                <span className="ai-badge-next-desc">{nextBadge.description}</span>
              </div>
            )}
          </div>
        </section>

        {/* 今日数据 */}
        {todayRecord && (
          <section className="ai-section">
            <h2 className="ai-section-title">
              <IconFlame size={16} color="#e17055" />
              今日数据
            </h2>
            <div className="ai-today-card">
              <div className="ai-today-stat">
                <span className="ai-today-num">{todayRecord.completedCount}</span>
                <span className="ai-today-label">完成任务</span>
              </div>
              <div className="ai-today-divider" />
              <div className="ai-today-stat">
                <span className="ai-today-num">+{todayRecord.pointsEarned}</span>
                <span className="ai-today-label">获得经验</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

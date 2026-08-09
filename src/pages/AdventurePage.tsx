import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { CHAPTERS } from '../data/chapters';
import { checkChapterCondition } from '../utils/gamification';
import { IconCheck, IconPin, IconLock, IconMap, IconSword } from '../components/common/Icons';
import './AdventurePage.css';

export default function AdventurePage() {
  const { storyProgress, storyLogs, userProfile, knowledge } = useStore();
  const [activeTab, setActiveTab] = useState<'map' | 'logs'>('map');

  const currentChapter = CHAPTERS.find(c => c.id === storyProgress.currentChapter);

  const sortedLogs = useMemo(() => {
    return [...storyLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [storyLogs]);

  const logsByChapter = useMemo(() => {
    const map: Record<number, typeof sortedLogs> = {};
    sortedLogs.forEach(log => {
      if (!map[log.chapterId]) map[log.chapterId] = [];
      map[log.chapterId].push(log);
    });
    return map;
  }, [sortedLogs]);

  const ctx = {
    completedTaskCount: userProfile.completedTaskCount,
    knowledgeCount: knowledge.length,
    currentStreak: userProfile.currentStreak,
  };

  return (
    <div className="page adventure-page">
      {/* 页面标题 */}
      <div className="adventure-page-header">
        <div className="adventure-page-icon">
          <IconMap size={22} color="#fff" />
        </div>
        <h1 className="adventure-page-title">冒险故事</h1>
      </div>

      {/* 当前章节概览 */}
      {currentChapter && (
        <div className="adventure-current-card">
          <div className="adventure-current-header">
            <span className="adventure-chapter-tag">第{currentChapter.id}章</span>
            <span className="adventure-area">{currentChapter.area}</span>
          </div>
          <h2 className="adventure-current-title">{currentChapter.title}</h2>

          {/* Boss HP */}
          {currentChapter.bossName && (
            <div className="adventure-boss-section">
              <div className="adventure-boss-header">
                <span className="adventure-boss-name">
                  <IconSword size={16} color="#ff7675" /> {currentChapter.bossName}
                </span>
                <span className="adventure-boss-hp">
                  {storyProgress.bossCurrentHP[currentChapter.id] ?? currentChapter.bossHP} / {currentChapter.bossHP}
                </span>
              </div>
              <div className="progress-bar adventure-boss-bar">
                <div
                  className="progress-fill adventure-boss-fill"
                  style={{
                    width: `${((storyProgress.bossCurrentHP[currentChapter.id] ?? currentChapter.bossHP) / currentChapter.bossHP) * 100}%`,
                    background: 'linear-gradient(90deg, #e74c3c, #c0392b)',
                  }}
                />
              </div>
              <p className="adventure-boss-hint">完成任务即可对 Boss 造成伤害</p>
            </div>
          )}

          {/* 推进条件 */}
          {!currentChapter.bossName && (
            <div className="adventure-condition">
              <p className="adventure-condition-text">
                {getConditionText(currentChapter.condition, currentChapter.conditionValue)}
              </p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getConditionProgress(currentChapter, ctx) * 100}%` }}
                />
              </div>
              <p className="adventure-condition-progress">
                {getConditionCurrent(currentChapter.condition, ctx)} / {currentChapter.conditionValue}
              </p>
            </div>
          )}

          <div className="adventure-story-text">{currentChapter.storyText}</div>
        </div>
      )}

      {/* Tab 切换 */}
      <div className="adventure-tabs">
        <button
          className={`adventure-tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >地图</button>
        <button
          className={`adventure-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >故事日志</button>
      </div>

      {activeTab === 'map' ? (
        <div className="adventure-map">
          {CHAPTERS.map(chapter => {
            const unlocked = storyProgress.unlockedChapters.includes(chapter.id);
            const defeated = storyProgress.defeatedBosses.includes(chapter.id);
            const isCurrent = chapter.id === storyProgress.currentChapter;

            return (
              <div
                key={chapter.id}
                className={`adventure-map-node ${unlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`}
              >
                <div className="adventure-map-marker">
                  {defeated ? (
                    <IconCheck size={20} color="var(--color-success, #00b894)" />
                  ) : unlocked ? (
                    <IconPin size={20} color="var(--color-primary)" />
                  ) : (
                    <IconLock size={20} color="var(--color-text-light)" />
                  )}
                </div>
                <div className="adventure-map-info">
                  <div className="adventure-map-title">
                    第{chapter.id}章 · {chapter.title}
                  </div>
                  <div className="adventure-map-area">{chapter.area}</div>
                  {unlocked && chapter.bossName && (
                    <div className="adventure-map-boss">
                      {defeated ? `已击败 ${chapter.bossName}` : `Boss: ${chapter.bossName} HP:${chapter.bossHP}`}
                    </div>
                  )}
                  {!unlocked && (
                    <div className="adventure-map-locked">
                      解锁条件: {getConditionText(chapter.condition, chapter.conditionValue)}
                    </div>
                  )}
                </div>
                {isCurrent && <span className="adventure-map-current-badge">当前</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="adventure-logs">
          {sortedLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon-flat">
                <IconMap size={48} color="var(--color-text-light)" />
              </div>
              <p>完成任务后会自动生成故事日志</p>
            </div>
          ) : (
            CHAPTERS.slice().reverse().map(chapter => {
              const logs = logsByChapter[chapter.id] || [];
              if (logs.length === 0) return null;
              return (
                <div key={chapter.id} className="adventure-log-section">
                  <h4 className="adventure-log-chapter">第{chapter.id}章 · {chapter.title}</h4>
                  {logs.map(log => (
                    <div key={log.id} className="adventure-log-item">
                      <span className="adventure-log-time">
                        {new Date(log.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <p className="adventure-log-text">{log.text}</p>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function getConditionText(condition: string, value: number): string {
  switch (condition) {
    case 'completed_tasks': return `完成 ${value} 个任务`;
    case 'streak_days': return `连续 ${value} 天完成任务`;
    case 'knowledge_count': return `创建 ${value} 条知识`;
    default: return '';
  }
}

function getConditionCurrent(condition: string, ctx: { completedTaskCount: number; knowledgeCount: number; currentStreak: number }): number {
  switch (condition) {
    case 'completed_tasks': return ctx.completedTaskCount;
    case 'streak_days': return ctx.currentStreak;
    case 'knowledge_count': return ctx.knowledgeCount;
    default: return 0;
  }
}

function getConditionProgress(chapter: { condition: string; conditionValue: number }, ctx: { completedTaskCount: number; knowledgeCount: number; currentStreak: number }): number {
  const current = getConditionCurrent(chapter.condition, ctx);
  return Math.min(1, current / chapter.conditionValue);
}

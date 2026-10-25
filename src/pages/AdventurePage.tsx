import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import { CHAPTERS } from '../data/chapters';
import { IconCheck, IconPin, IconLock, IconMap, IconSword, IconBook, IconCoins } from '../components/common/Icons';
import type { LogType } from '../types';
import './AdventurePage.css';

const LOG_TYPE_LABELS: Record<LogType, string> = {
  damage: '伤害',
  task: '任务',
  story: '剧情',
};

// 选项效果标签
const EFFECT_LABELS: Record<string, string> = {
  damage: '伤害',
  weaken: '削弱',
  loot: '金币',
};

function getOptionTag(option: { effect?: string; damage: number; weakenMultiplier?: number; weakenTurns?: number; lootCoins?: number }) {
  const effect = option.effect || 'damage';
  if (effect === 'weaken') {
    return `削弱 ×${option.weakenMultiplier ?? 1.5} / ${option.weakenTurns ?? 3} 次`;
  }
  if (effect === 'loot') {
    return `+${option.lootCoins ?? 0} 金币`;
  }
  return `${option.damage} 伤害`;
}

export default function AdventurePage() {
  const { storyProgress, storyLogs, userProfile, knowledge, adventureOption } = useStore();
  const addToast = useToastStore(s => s.addToast);
  const [activeTab, setActiveTab] = useState<'map' | 'logs'>('logs');
  const [interactMsg, setInteractMsg] = useState<string | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);

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

  // Boss 是否已被击败
  const bossDefeated = currentChapter ? storyProgress.defeatedBosses.includes(currentChapter.id) : false;

  // 当前 Boss 的削弱状态
  const weaken = currentChapter ? storyProgress.bossWeaken?.[currentChapter.id] : undefined;

  // 互动处理：消耗金币选择选项
  const handleOption = (optionId: string) => {
    if (!currentChapter || bossDefeated || isAttacking) return;
    setIsAttacking(true);
    setInteractMsg(null);

    setTimeout(() => {
      const result = adventureOption(optionId);
      setInteractMsg(result.message);

      if (result.bossDamage > 0) {
        addToast({ icon: '⚔', title: `${result.bossDamage} 点伤害！` });
      }
      if (result.weakened) {
        addToast({ icon: '↓', title: 'Boss 防御已被削弱' });
      }
      if (result.coinsGained > 0) {
        addToast({ icon: '◉', title: `+${result.coinsGained} 金币` });
      }
      if (result.bossDefeated) {
        addToast({ icon: '★', title: `击败了 ${currentChapter.bossName}！` });
      }

      setIsAttacking(false);
      setTimeout(() => setInteractMsg(null), 3500);
    }, 300);
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

      {/* 当前章节 - 剧情区 */}
      {currentChapter && (
        <div className="adventure-story-card">
          <div className="adventure-story-card-header">
            <span className="adventure-chapter-tag">第{currentChapter.id}章</span>
            <span className="adventure-area">{currentChapter.area}</span>
          </div>
          <h2 className="adventure-story-card-title">{currentChapter.title}</h2>
          <div className="adventure-story-divider" />
          <div className="adventure-story-narrative">
            <IconBook size={14} color="var(--color-primary)" className="adventure-story-icon" />
            <p className="adventure-story-text">{currentChapter.storyText}</p>
          </div>
        </div>
      )}

      {/* 当前章节 - 进度区 */}
      {currentChapter && (
        <div className="adventure-progress-card">
          <div className="adventure-progress-card-header">
            <span className="adventure-progress-label">冒险进度</span>
          </div>

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
              <p className="adventure-boss-hint">完成任务或子任务即可对 Boss 造成伤害，也可消耗金币选择互动选项</p>

              {/* Boss 削弱状态 */}
              {weaken && weaken.remaining > 0 && (
                <div className="adventure-boss-weaken">
                  防御削弱中 · 接下来 {weaken.remaining} 次出手伤害 ×{weaken.multiplier}
                </div>
              )}

              {/* 金币余额 */}
              <div className="adventure-coins-bar">
                <IconCoins size={16} color="#ffd93d" />
                <span className="adventure-coins-value">{userProfile.coins}</span>
                <span className="adventure-coins-label">金币</span>
              </div>

              {/* 互动选项按钮 */}
              {!bossDefeated && currentChapter.options && currentChapter.options.length > 0 && (
                <div className="adventure-options">
                  {currentChapter.options.map(option => {
                    const canAfford = userProfile.coins >= option.cost;
                    const disabled = isAttacking || !canAfford;
                    const effect = option.effect || 'damage';
                    return (
                      <button
                        key={option.id}
                        className={`adventure-option-btn effect-${effect} ${disabled ? 'disabled' : ''} ${!canAfford ? 'locked' : ''}`}
                        onClick={() => handleOption(option.id)}
                        disabled={disabled}
                      >
                        <div className="adventure-option-top">
                          <span className="adventure-option-label">
                            <IconSword size={14} color="#fff" /> {option.label}
                          </span>
                          <span className="adventure-option-damage">{getOptionTag(option)}</span>
                        </div>
                        <div className="adventure-option-desc">{option.description}</div>
                        <div className="adventure-option-cost">
                          <span className="adventure-option-effect">{EFFECT_LABELS[effect]}</span>
                          <IconCoins size={12} color="#ffd93d" />
                          {option.cost > 0 ? `${option.cost} 金币` : '免费'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 互动反馈消息 */}
              {interactMsg && (
                <div className="adventure-interact-msg">
                  {interactMsg}
                </div>
              )}

              {/* Boss 已击败提示 */}
              {bossDefeated && (
                <div className="adventure-boss-defeated">
                  <IconCheck size={16} color="#00b894" /> Boss 已被击败
                </div>
              )}
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
        </div>
      )}

      {/* Tab 切换 */}
      <div className="adventure-tabs">
        <button
          className={`adventure-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >故事日志</button>
        <button
          className={`adventure-tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >地图</button>
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
                <IconBook size={48} color="var(--color-text-light)" />
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
                    <div key={log.id} className={`adventure-log-item log-type-${log.type || 'story'}`}>
                      <div className="adventure-log-header">
                        <span className={`adventure-log-badge log-badge-${log.type || 'story'}`}>
                          {LOG_TYPE_LABELS[log.type as LogType] || '剧情'}
                        </span>
                        <span className="adventure-log-time">
                          {new Date(log.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
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

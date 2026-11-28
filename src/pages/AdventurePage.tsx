import { useState, useMemo } from 'react';
import { useStore, FARM_CROPS, FARM_BUILDINGS } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import { CHAPTERS } from '../data/chapters';
import { IconCheck, IconPin, IconLock, IconMap, IconSword, IconBook, IconCoins, IconSeedling } from '../components/common/Icons';
import type { LogType } from '../types';
import './AdventurePage.css';

const LOG_TYPE_LABELS: Record<LogType, string> = {
  damage: '伤害',
  task: '任务',
  story: '剧情',
};

// 选项效果标签（冒险章节已完全移除金币相关选项，仅保留：悟道 / 祈福）
const EFFECT_LABELS: Record<string, string> = {
  wisdom: '悟道',
  favor: '祈福',
};

function getOptionTag(option: { effect: string; wisdomPoints?: number; favorShields?: number }) {
  switch (option.effect) {
    case 'wisdom':  return `+${option.wisdomPoints ?? 0} 经验`;
    case 'favor':   return `+${option.favorShields ?? 1} 护盾`;
    default:        return '';
  }
}

function getSideOptionTag(opt: { wisdomPoints?: number; favorShields?: number }) {
  const parts: string[] = [];
  if (opt.wisdomPoints) parts.push(`+${opt.wisdomPoints} 经验`);
  if (opt.favorShields) parts.push(`+${opt.favorShields} 护盾`);
  return parts.join(' · ') || '剧情选择';
}

export default function AdventurePage() {
  const { storyProgress, storyLogs, userProfile, knowledge, adventureOption, unlockSideQuest, completeSideQuestOption, farm, farmBuildings, plantCrop, harvestCrop, upgradeBuilding } = useStore();
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

  // 已使用的一次性选项
  const usedOptions = currentChapter ? (storyProgress.usedOptions?.[currentChapter.id] || []) : [];

  // 当前章节的支线
  const chapterSideQuests = currentChapter?.sideQuests || [];

  // 互动处理：消耗金币选择选项
  const handleOption = (optionId: string) => {
    if (!currentChapter || bossDefeated || isAttacking) return;
    setIsAttacking(true);
    setInteractMsg(null);

    setTimeout(() => {
      const result = adventureOption(optionId);
      setInteractMsg(result.message);

      if (result.pointsGained > 0) {
        addToast({ icon: '★', title: `+${result.pointsGained} 经验值` });
      }
      if (result.shieldsGained > 0) {
        addToast({ icon: '🛡', title: `+${result.shieldsGained} 张护盾` });
      }

      setIsAttacking(false);
      setTimeout(() => setInteractMsg(null), 3500);
    }, 300);
  };

  // 支线：解锁（章节推进时已自动解锁，此处为兜底）
  const handleUnlockSideQuest = (sideQuestId: string) => {
    const result = unlockSideQuest(sideQuestId);
    addToast({ icon: '📖', title: result.message });
  };

  // 支线：选择当前阶段的选项
  const handleSideQuestOption = (sideQuestId: string, optionId: string) => {
    const result = completeSideQuestOption(sideQuestId, optionId);
    if (result.locked) {
      addToast({ icon: '🔒', title: '再完成一些任务', subtitle: result.message });
      return;
    }
    if (result.pointsGained > 0) addToast({ icon: '★', title: `+${result.pointsGained} 经验值` });
    if (result.shieldsGained > 0) addToast({ icon: '🛡', title: `+${result.shieldsGained} 张护盾` });
    addToast({ icon: '📜', title: result.sideQuestCompleted ? '支线已完成' : '支线推进', subtitle: result.message });
  };

  // 农田：建筑加成后的实际种子费用 / 成熟所需任务 / 收获金币
  const cropCost = (cost: number) => Math.max(1, Math.round(cost * (1 - 0.1 * farmBuildings.workshop)));
  const cropRequired = (required: number) => Math.max(1, required - farmBuildings.windmill);
  const cropReward = (reward: number) => Math.round(reward * (1 + 0.15 * farmBuildings.barn));

  // 农田：播种
  const handlePlant = (plotId: number, cropKey: string) => {
    const crop = FARM_CROPS[cropKey];
    if (!crop) return;
    if (plantCrop(plotId, cropKey)) {
      addToast({
        icon: crop.emoji,
        title: `已种下${crop.name}`,
        subtitle: `完成 ${cropRequired(crop.required)} 个任务后成熟`,
      });
    } else {
      addToast({ icon: '!', title: '无法播种', subtitle: '金币不足或地块已占用' });
    }
  };

  // 农田：收获
  const handleHarvest = (plotId: number) => {
    const coins = harvestCrop(plotId);
    if (coins > 0) {
      addToast({ icon: '◉', title: `收获 +${coins} 金币`, subtitle: '农田已清空，可继续播种' });
    }
  };

  // 建筑：升级
  const handleUpgrade = (key: keyof typeof FARM_BUILDINGS) => {
    const building = FARM_BUILDINGS[key];
    const level = farmBuildings[key];
    if (upgradeBuilding(key)) {
      addToast({ icon: building.emoji, title: `${building.name}升到 ${level + 1} 级`, subtitle: building.desc });
    } else {
      addToast({ icon: '!', title: '无法升级', subtitle: level >= building.max ? '已达到最高等级' : '金币不足' });
    }
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
              <p className="adventure-boss-hint">完成任务或子任务即可对 Boss 造成伤害，互动选项可获取经验与护盾等非伤害增益</p>

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
                    const isUsed = !!option.oneTime && usedOptions.includes(option.id);
                    const disabled = isAttacking || isUsed;
                    return (
                      <button
                        key={option.id}
                        className={`adventure-option-btn effect-${option.effect} ${disabled ? 'disabled' : ''} ${isUsed ? 'used' : ''}`}
                        onClick={() => handleOption(option.id)}
                        disabled={disabled}
                      >
                        <div className="adventure-option-top">
                          <span className="adventure-option-label">{option.label}</span>
                          <span className="adventure-option-damage">{isUsed ? '已使用' : getOptionTag(option)}</span>
                        </div>
                        <div className="adventure-option-desc">{option.description}</div>
                        <div className="adventure-option-cost">
                          <span className="adventure-option-effect">{EFFECT_LABELS[option.effect]}</span>
                          <span>{option.oneTime ? '本章限一次' : '可重复选择'}</span>
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

      {/* 章节支线（多阶段，与任务进度关联） */}
      {currentChapter && chapterSideQuests.length > 0 && (
        <div className="adventure-sidequests-card">
          <div className="adventure-sidequests-header">
            <h3 className="adventure-sidequests-title">📖 章节支线</h3>
            <span className="adventure-sidequests-hint">每完成一个任务推进支线进度，达成条件后可做出剧情选择</span>
          </div>
          {chapterSideQuests.map(sq => {
            const unlocked = storyProgress.unlockedSideQuests.includes(sq.id);
            const completed = storyProgress.completedSideQuests.includes(sq.id);
            const stageIdx = storyProgress.sideQuestStage[sq.id] || 0;
            const progress = storyProgress.sideQuestTaskProgress[sq.id] || 0;
            const totalStages = sq.stages.length;
            const currentStage = sq.stages[Math.min(stageIdx, totalStages - 1)];
            const stageReady = currentStage ? progress >= currentStage.tasksRequired : false;
            return (
              <div key={sq.id} className={`sidequest-card ${completed ? 'completed' : unlocked ? 'active' : 'locked'}`}>
                <div className="sidequest-head">
                  <span className="sidequest-emoji">{sq.emoji}</span>
                  <div className="sidequest-info">
                    <div className="sidequest-title">{sq.title}</div>
                    <div className="sidequest-sub">
                      {completed ? '已完结' : unlocked ? `第 ${Math.min(stageIdx + 1, totalStages)} / ${totalStages} 幕` : '随章节解锁'}
                    </div>
                  </div>
                  {completed && <span className="sidequest-status">✓ 已完成</span>}
                </div>

                {!unlocked && !completed && (
                  <div className="sidequest-locked-hint">
                    <IconLock size={13} color="var(--color-text-light)" /> 该支线将随章节推进自动解锁
                  </div>
                )}

                {unlocked && !completed && currentStage && (
                  <>
                    <p className="sidequest-story">{sq.intro}</p>

                    {/* 阶段进度（与任务完成数关联） */}
                    <div className="sidequest-stage-progress">
                      <div className="sidequest-stage-label">
                        第 {stageIdx + 1} 幕 · 完成任务 {Math.min(progress, currentStage.tasksRequired)} / {currentStage.tasksRequired}
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(100, (progress / Math.max(1, currentStage.tasksRequired)) * 100)}%` }}
                        />
                      </div>
                      {!stageReady && (
                        <div className="sidequest-progress-hint">
                          再完成 {currentStage.tasksRequired - progress} 个任务，即可在本幕做出选择
                        </div>
                      )}
                    </div>

                    <p className="sidequest-stage-text">{currentStage.text}</p>

                    <div className="sidequest-options">
                      {currentStage.options.map(opt => {
                        const used = (storyProgress.usedSideQuestOptions[sq.id] || []).includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            className={`sidequest-option-btn ${stageReady && !used ? '' : 'disabled'}`}
                            onClick={() => handleSideQuestOption(sq.id, opt.id)}
                            disabled={!stageReady || used}
                          >
                            <span className="sidequest-option-label">{opt.label}</span>
                            <span className="sidequest-option-desc">{opt.description}</span>
                            <span className="sidequest-option-rewards">{getSideOptionTag(opt)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {completed && (
                  <div className="sidequest-completed-text">支线「{sq.title}」已落幕，你的选择已记入故事日志。</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 家园农田 */}
      <div className="adventure-farm-card">
        <div className="adventure-farm-header">
          <h3 className="adventure-farm-title">
            <IconSeedling size={18} color="#00b894" /> 家园农田
          </h3>
          <span className="adventure-farm-hint">完成主任务让作物成长</span>
        </div>
        <div className="adventure-farm-plots">
          {farm.map(plot => {
            const crop = plot.crop ? FARM_CROPS[plot.crop] : null;
            const ready = !!crop && plot.progress >= plot.required;
            const pct = crop ? Math.min(100, Math.round((plot.progress / Math.max(1, plot.required)) * 100)) : 0;
            return (
              <div key={plot.id} className={`farm-plot ${crop ? 'planted' : ''} ${ready ? 'ready' : ''}`}>
                {crop ? (
                  <>
                    <div className="farm-plot-crop">
                      <span className="farm-plot-emoji">{crop.emoji}</span>
                      <span className="farm-plot-name">{crop.name}</span>
                    </div>
                    <div className="farm-plot-bar">
                      <div className="farm-plot-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="farm-plot-meta">
                      {ready ? '已成熟' : `${plot.progress}/${plot.required} 个任务`}
                    </div>
                    <button className="farm-harvest-btn" disabled={!ready} onClick={() => handleHarvest(plot.id)}>
                      {ready ? `收获 +${plot.reward} 金币` : '成长中…'}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="farm-plot-empty">空地</div>
                    <div className="farm-plant-options">
                      {Object.entries(FARM_CROPS).map(([key, c]) => (
                        <button
                          key={key}
                          className="farm-plant-btn"
                          disabled={userProfile.coins < cropCost(c.cost)}
                          onClick={() => handlePlant(plot.id, key)}
                        >
                          <span className="farm-plant-label">{c.emoji} {c.name}</span>
                          <span className="farm-plant-cost">{cropCost(c.cost)} 金币 · {cropRequired(c.required)} 任务 · +{cropReward(c.reward)}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* 家园建筑 */}
        <div className="adventure-buildings">
          <div className="adventure-buildings-header">
            <h4 className="adventure-buildings-title">家园建筑</h4>
            <span className="adventure-buildings-hint">升级后对之后播种的作物生效</span>
          </div>
          <div className="adventure-building-list">
            {(Object.keys(FARM_BUILDINGS) as (keyof typeof FARM_BUILDINGS)[]).map(key => {
              const building = FARM_BUILDINGS[key];
              const level = farmBuildings[key];
              const maxed = level >= building.max;
              const upgradeCost = building.baseCost * (level + 1);
              const affordable = userProfile.coins >= upgradeCost;
              return (
                <div key={key} className={`building-card ${maxed ? 'maxed' : ''}`}>
                  <div className="building-card-top">
                    <span className="building-emoji">{building.emoji}</span>
                    <div className="building-info">
                      <span className="building-name">
                        {building.name}
                        <span className="building-level">Lv.{level}/{building.max}</span>
                      </span>
                      <span className="building-desc">{building.desc}</span>
                    </div>
                  </div>
                  <div className="building-level-dots">
                    {Array.from({ length: building.max }).map((_, i) => (
                      <span key={i} className={`building-dot ${i < level ? 'active' : ''}`} />
                    ))}
                  </div>
                  <button
                    className="building-upgrade-btn"
                    disabled={maxed || !affordable}
                    onClick={() => handleUpgrade(key)}
                  >
                    {maxed ? '已满级' : `升级 · ${upgradeCost} 金币`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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

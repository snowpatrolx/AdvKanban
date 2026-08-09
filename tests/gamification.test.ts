import { describe, it, expect } from 'vitest';
import {
  calculateTaskPoints,
  getLevelByPoints,
  getLevelProgress,
  updateStreak,
  checkBadge,
  checkAllBadges,
  checkChapterCondition,
  calculateBossDamage,
  updateDailyRecord,
  LEVELS,
} from '../src/utils/gamification';
import { getTodayStr, daysBetween } from '../src/utils/id';

// ===== 积分计算 =====
describe('积分计算', () => {
  it('普通任务 +10 基础分', () => {
    const result = calculateTaskPoints(null, 0);
    expect(result.basePoints).toBe(10);
  });

  it('中优先级任务 +10 基础分', () => {
    const result = calculateTaskPoints('medium', 0);
    expect(result.basePoints).toBe(10);
  });

  it('低优先级任务 +10 基础分', () => {
    const result = calculateTaskPoints('low', 0);
    expect(result.basePoints).toBe(10);
  });

  it('高优先级任务 +20 基础分', () => {
    const result = calculateTaskPoints('high', 0);
    expect(result.basePoints).toBe(20);
  });

  it('首次完成任务（streak=0）连续奖励 +5', () => {
    const result = calculateTaskPoints(null, 0);
    // N = min(0+1, 7) = 1, streakBonus = 5*1 = 5
    expect(result.streakBonus).toBe(5);
    expect(result.total).toBe(15);
  });

  it('连续第3天完成任务 连续奖励 +15', () => {
    const result = calculateTaskPoints(null, 2);
    // N = min(2+1, 7) = 3, streakBonus = 5*3 = 15
    expect(result.streakBonus).toBe(15);
    expect(result.total).toBe(25);
  });

  it('连续第7天及以上 连续奖励上限 +35', () => {
    const result7 = calculateTaskPoints(null, 6);
    // N = min(6+1, 7) = 7, streakBonus = 5*7 = 35
    expect(result7.streakBonus).toBe(35);

    const result10 = calculateTaskPoints(null, 9);
    // N = min(9+1, 7) = 7 (capped), streakBonus = 35
    expect(result10.streakBonus).toBe(35);
  });

  it('高优先级 + 连续7天 = 20 + 35 = 55', () => {
    const result = calculateTaskPoints('high', 6);
    expect(result.total).toBe(55);
  });
});

// ===== 等级判定 =====
describe('等级判定', () => {
  it('0 积分为 Lv.1 新手', () => {
    const result = getLevelByPoints(0);
    expect(result.level).toBe(1);
    expect(result.name).toBe('新手');
  });

  it('99 积分仍为 Lv.1', () => {
    const result = getLevelByPoints(99);
    expect(result.level).toBe(1);
  });

  it('100 积分升级为 Lv.2 学徒', () => {
    const result = getLevelByPoints(100);
    expect(result.level).toBe(2);
    expect(result.name).toBe('学徒');
  });

  it('300 积分为 Lv.3 熟练', () => {
    const result = getLevelByPoints(300);
    expect(result.level).toBe(3);
    expect(result.name).toBe('熟练');
  });

  it('600 积分为 Lv.4 能手', () => {
    const result = getLevelByPoints(600);
    expect(result.level).toBe(4);
    expect(result.name).toBe('能手');
  });

  it('1000 积分为 Lv.5 专家', () => {
    const result = getLevelByPoints(1000);
    expect(result.level).toBe(5);
    expect(result.name).toBe('专家');
  });

  it('2000 积分为 Lv.6 大师', () => {
    const result = getLevelByPoints(2000);
    expect(result.level).toBe(6);
    expect(result.name).toBe('大师');
  });

  it('超过2000积分仍为 Lv.6', () => {
    const result = getLevelByPoints(99999);
    expect(result.level).toBe(6);
  });
});

// ===== 等级进度 =====
describe('等级进度', () => {
  it('0 积分进度为 0%', () => {
    const progress = getLevelProgress(0);
    expect(progress.progress).toBe(0);
    expect(progress.pointsToNext).toBe(100);
  });

  it('50 积分进度为 50%', () => {
    const progress = getLevelProgress(50);
    expect(progress.progress).toBe(50);
    expect(progress.pointsToNext).toBe(50);
  });

  it('满级后进度为 100%', () => {
    const progress = getLevelProgress(2000);
    expect(progress.progress).toBe(100);
    expect(progress.pointsToNext).toBeNull();
  });
});

// ===== 连续打卡天数 =====
describe('连续打卡天数', () => {
  it('第一次完成任务 streak=1', () => {
    expect(updateStreak(null, '2026-01-01', 0)).toBe(1);
  });

  it('昨天完成过 streak+1', () => {
    expect(updateStreak('2026-01-01', '2026-01-02', 1)).toBe(2);
  });

  it('今天已完成过 不变', () => {
    expect(updateStreak('2026-01-01', '2026-01-01', 1)).toBe(1);
  });

  it('间隔2天 重置为1', () => {
    expect(updateStreak('2026-01-01', '2026-01-03', 3)).toBe(1);
  });

  it('间隔30天 重置为1', () => {
    expect(updateStreak('2026-01-01', '2026-01-31', 5)).toBe(1);
  });

  it('连续7天后第8天 streak=8', () => {
    expect(updateStreak('2026-01-07', '2026-01-08', 7)).toBe(8);
  });
});

// ===== 徽章判定 =====
describe('徽章获取', () => {
  const baseCtx = {
    completedTaskCount: 0,
    knowledgeCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    storyComplete: false,
  };

  it('初出茅庐: 完成1个任务', () => {
    expect(checkBadge('first_task', { ...baseCtx, completedTaskCount: 1 })).toBe(true);
    expect(checkBadge('first_task', { ...baseCtx, completedTaskCount: 0 })).toBe(false);
  });

  it('小有成就: 完成10个任务', () => {
    expect(checkBadge('ten_tasks', { ...baseCtx, completedTaskCount: 10 })).toBe(true);
    expect(checkBadge('ten_tasks', { ...baseCtx, completedTaskCount: 9 })).toBe(false);
  });

  it('任务达人: 完成50个任务', () => {
    expect(checkBadge('fifty_tasks', { ...baseCtx, completedTaskCount: 50 })).toBe(true);
    expect(checkBadge('fifty_tasks', { ...baseCtx, completedTaskCount: 49 })).toBe(false);
  });

  it('连续三天: 最长连续3天', () => {
    expect(checkBadge('streak_3', { ...baseCtx, longestStreak: 3 })).toBe(true);
    expect(checkBadge('streak_3', { ...baseCtx, longestStreak: 2 })).toBe(false);
  });

  it('一周连胜: 最长连续7天', () => {
    expect(checkBadge('streak_7', { ...baseCtx, longestStreak: 7 })).toBe(true);
    expect(checkBadge('streak_7', { ...baseCtx, longestStreak: 6 })).toBe(false);
  });

  it('知识播种: 创建1条知识', () => {
    expect(checkBadge('first_knowledge', { ...baseCtx, knowledgeCount: 1 })).toBe(true);
    expect(checkBadge('first_knowledge', { ...baseCtx, knowledgeCount: 0 })).toBe(false);
  });

  it('知识积累: 创建10条知识', () => {
    expect(checkBadge('ten_knowledge', { ...baseCtx, knowledgeCount: 10 })).toBe(true);
    expect(checkBadge('ten_knowledge', { ...baseCtx, knowledgeCount: 9 })).toBe(false);
  });

  it('屠龙者: 通关全部章节', () => {
    expect(checkBadge('dragon_slayer', { ...baseCtx, storyComplete: true })).toBe(true);
    expect(checkBadge('dragon_slayer', { ...baseCtx, storyComplete: false })).toBe(false);
  });

  it('checkAllBadges 返回新获得的徽章', () => {
    const newBadges = checkAllBadges([], {
      ...baseCtx,
      completedTaskCount: 1,
      knowledgeCount: 1,
    });
    expect(newBadges).toContain('first_task');
    expect(newBadges).toContain('first_knowledge');
  });

  it('checkAllBadges 不返回已获得的徽章', () => {
    const newBadges = checkAllBadges(['first_task'], {
      ...baseCtx,
      completedTaskCount: 1,
    });
    expect(newBadges).not.toContain('first_task');
  });
});

// ===== 章节推进条件 =====
describe('章节推进条件', () => {
  const ctx = {
    completedTaskCount: 5,
    knowledgeCount: 3,
    currentStreak: 2,
  };

  it('completed_tasks 条件', () => {
    expect(checkChapterCondition('completed_tasks', 1, ctx)).toBe(true);
    expect(checkChapterCondition('completed_tasks', 5, ctx)).toBe(true);
    expect(checkChapterCondition('completed_tasks', 6, ctx)).toBe(false);
  });

  it('streak_days 条件', () => {
    expect(checkChapterCondition('streak_days', 2, ctx)).toBe(true);
    expect(checkChapterCondition('streak_days', 3, ctx)).toBe(false);
  });

  it('knowledge_count 条件', () => {
    expect(checkChapterCondition('knowledge_count', 3, ctx)).toBe(true);
    expect(checkChapterCondition('knowledge_count', 4, ctx)).toBe(false);
  });

  it('第1章: 完成1个任务', () => {
    expect(checkChapterCondition('completed_tasks', 1, { ...ctx, completedTaskCount: 1 })).toBe(true);
  });

  it('第2章: 连续3天', () => {
    expect(checkChapterCondition('streak_days', 3, { ...ctx, currentStreak: 3 })).toBe(true);
  });

  it('第3章: 累计10个任务', () => {
    expect(checkChapterCondition('completed_tasks', 10, { ...ctx, completedTaskCount: 10 })).toBe(true);
  });

  it('第4章: 创建5条知识', () => {
    expect(checkChapterCondition('knowledge_count', 5, { ...ctx, knowledgeCount: 5 })).toBe(true);
  });

  it('第5章: 连续30天', () => {
    expect(checkChapterCondition('streak_days', 30, { ...ctx, currentStreak: 30 })).toBe(true);
  });
});

// ===== Boss 战伤害 =====
describe('Boss 战伤害', () => {
  it('普通攻击减少 HP', () => {
    const result = calculateBossDamage(100, 100, 15);
    expect(result.damage).toBe(15);
    expect(result.remainingHP).toBe(85);
    expect(result.isDefeated).toBe(false);
  });

  it('致命一击击败 Boss', () => {
    const result = calculateBossDamage(50, 20, 20);
    expect(result.remainingHP).toBe(0);
    expect(result.isDefeated).toBe(true);
  });

  it('过度伤害 HP 不为负', () => {
    const result = calculateBossDamage(50, 10, 100);
    expect(result.remainingHP).toBe(0);
    expect(result.isDefeated).toBe(true);
  });

  it('Boss HP:50 可被 3 次普通任务(15分) 击败', () => {
    let hp = 50;
    let result;
    for (let i = 0; i < 3; i++) {
      result = calculateBossDamage(50, hp, 15);
      hp = result.remainingHP;
    }
    // 3 * 15 = 45, 还剩 5
    expect(hp).toBe(5);
    expect(result!.isDefeated).toBe(false);

    // 第4次击败
    result = calculateBossDamage(50, hp, 15);
    expect(result.remainingHP).toBe(0);
    expect(result.isDefeated).toBe(true);
  });

  it('Boss HP:500 需要多次攻击', () => {
    let hp = 500;
    let attacks = 0;
    while (hp > 0) {
      const result = calculateBossDamage(500, hp, 20);
      hp = result.remainingHP;
      attacks++;
    }
    // 500 / 20 = 25 次
    expect(attacks).toBe(25);
  });
});

// ===== 每日记录 =====
describe('每日记录更新', () => {
  it('创建新的每日记录', () => {
    const records = updateDailyRecord([], '2026-01-01', 15);
    expect(records).toHaveLength(1);
    expect(records[0]).toEqual({ date: '2026-01-01', completedCount: 1, pointsEarned: 15 });
  });

  it('更新已有的每日记录', () => {
    const existing = [{ date: '2026-01-01', completedCount: 1, pointsEarned: 15 }];
    const records = updateDailyRecord(existing, '2026-01-01', 20);
    expect(records).toHaveLength(1);
    expect(records[0].completedCount).toBe(2);
    expect(records[0].pointsEarned).toBe(35);
  });

  it('不同日期创建新记录', () => {
    const existing = [{ date: '2026-01-01', completedCount: 1, pointsEarned: 15 }];
    const records = updateDailyRecord(existing, '2026-01-02', 10);
    expect(records).toHaveLength(2);
  });
});

// ===== 日期工具 =====
describe('日期工具', () => {
  it('getTodayStr 返回 YYYY-MM-DD 格式', () => {
    const today = getTodayStr();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('daysBetween 计算天数差', () => {
    expect(daysBetween('2026-01-01', '2026-01-02')).toBe(1);
    expect(daysBetween('2026-01-01', '2026-01-01')).toBe(0);
    expect(daysBetween('2026-01-01', '2026-02-01')).toBe(31);
    expect(daysBetween('2026-01-02', '2026-01-01')).toBe(-1);
  });
});

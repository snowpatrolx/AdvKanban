import type { TaskPriority, UserProfile, StoryProgress, DailyRecord } from '../types';
import { getTodayStr, daysBetween } from './id';

// ===== 积分计算 =====

/**
 * 计算完成任务获得的积分
 * - 普通任务: +10
 * - 高优先级任务: +20
 * - 连续第 N 天: +5×N（上限 N=7）
 */
export function calculateTaskPoints(
  priority: TaskPriority,
  currentStreak: number
): { basePoints: number; streakBonus: number; total: number } {
  const basePoints = priority === 'high' ? 20 : 10;
  // 连续天数 N（当前已有 streak 天，今天完成是第 streak+1 天）
  // 但根据需求，连续第 N 天完成任务 +5×N，上限 N=7
  // currentStreak 是完成前的连续天数，完成今天后变成 currentStreak+1
  // 所以第 N 天 = currentStreak + 1
  const n = Math.min(currentStreak + 1, 7);
  const streakBonus = 5 * n;
  return { basePoints, streakBonus, total: basePoints + streakBonus };
}

// ===== 等级判定 =====

export const LEVELS = [
  { level: 1, name: '新手', minPoints: 0 },
  { level: 2, name: '学徒', minPoints: 100 },
  { level: 3, name: '熟练', minPoints: 300 },
  { level: 4, name: '能手', minPoints: 600 },
  { level: 5, name: '专家', minPoints: 1000 },
  { level: 6, name: '大师', minPoints: 2000 },
];

export function getLevelByPoints(points: number): { level: number; name: string; minPoints: number } {
  let result = LEVELS[0];
  for (const lv of LEVELS) {
    if (points >= lv.minPoints) {
      result = lv;
    }
  }
  return result;
}

/** 获取当前等级进度信息 */
export function getLevelProgress(points: number): {
  level: number;
  name: string;
  currentLevelMin: number;
  nextLevelMin: number | null;
  progress: number;  // 0-100
  pointsToNext: number | null;
} {
  const current = getLevelByPoints(points);
  const currentIdx = LEVELS.findIndex(l => l.level === current.level);
  const next = LEVELS[currentIdx + 1];

  if (!next) {
    return {
      level: current.level,
      name: current.name,
      currentLevelMin: current.minPoints,
      nextLevelMin: null,
      progress: 100,
      pointsToNext: null,
    };
  }

  const range = next.minPoints - current.minPoints;
  const earned = points - current.minPoints;
  return {
    level: current.level,
    name: current.name,
    currentLevelMin: current.minPoints,
    nextLevelMin: next.minPoints,
    progress: Math.min(100, Math.round((earned / range) * 100)),
    pointsToNext: next.minPoints - points,
  };
}

// ===== 连续打卡天数 =====

/**
 * 更新连续天数
 * @param lastCompletedDate 上次完成日期 YYYY-MM-DD
 * @param todayStr 今天的日期字符串
 * @returns 新的连续天数
 */
export function updateStreak(
  lastCompletedDate: string | null,
  todayStr: string,
  currentStreak: number
): number {
  if (!lastCompletedDate) {
    // 第一次完成任务
    return 1;
  }

  const diff = daysBetween(lastCompletedDate, todayStr);

  if (diff === 0) {
    // 今天已经完成过（不应该重复，但防御性处理）
    return currentStreak;
  }

  if (diff === 1) {
    // 昨天完成过，连续天数 +1
    return currentStreak + 1;
  }

  // 间隔超过 1 天，重置为 1
  return 1;
}

// ===== 徽章判定 =====

export interface BadgeCheckContext {
  completedTaskCount: number;
  knowledgeCount: number;
  currentStreak: number;
  longestStreak: number;
  storyComplete: boolean;
}

/**
 * 检查是否应该获得某徽章
 * @returns 是否满足条件
 */
export function checkBadge(condition: string, ctx: BadgeCheckContext): boolean {
  switch (condition) {
    case 'first_task':
      return ctx.completedTaskCount >= 1;
    case 'ten_tasks':
      return ctx.completedTaskCount >= 10;
    case 'fifty_tasks':
      return ctx.completedTaskCount >= 50;
    case 'streak_3':
      return ctx.longestStreak >= 3;
    case 'streak_7':
      return ctx.longestStreak >= 7;
    case 'first_knowledge':
      return ctx.knowledgeCount >= 1;
    case 'ten_knowledge':
      return ctx.knowledgeCount >= 10;
    case 'dragon_slayer':
      return ctx.storyComplete;
    default:
      return false;
  }
}

/**
 * 检查所有未获得的徽章，返回新获得的徽章 id 列表
 */
export function checkAllBadges(
  existingBadges: string[],
  ctx: BadgeCheckContext
): string[] {
  const newBadges: string[] = [];
  // 这里不能直接 import BADGES（避免循环依赖），用条件列表
  const allConditions = [
    'first_task', 'ten_tasks', 'fifty_tasks',
    'streak_3', 'streak_7',
    'first_knowledge', 'ten_knowledge',
    'dragon_slayer',
  ];
  for (const cond of allConditions) {
    if (!existingBadges.includes(cond) && checkBadge(cond, ctx)) {
      newBadges.push(cond);
    }
  }
  return newBadges;
}

// ===== 章节推进 =====

export interface ChapterCheckContext {
  completedTaskCount: number;
  knowledgeCount: number;
  currentStreak: number;
}

/**
 * 检查某个章节是否满足推进条件
 * condition 类型: completed_tasks / streak_days / knowledge_count
 */
export function checkChapterCondition(
  condition: string,
  conditionValue: number,
  ctx: ChapterCheckContext
): boolean {
  switch (condition) {
    case 'completed_tasks':
      return ctx.completedTaskCount >= conditionValue;
    case 'streak_days':
      return ctx.currentStreak >= conditionValue;
    case 'knowledge_count':
      return ctx.knowledgeCount >= conditionValue;
    default:
      return false;
  }
}

// ===== Boss 战伤害 =====

/**
 * Boss 战攻击伤害 = 任务获得的积分
 * @returns { damage, remainingHP, isDefeated }
 */
export function calculateBossDamage(
  bossMaxHP: number,
  bossCurrentHP: number,
  damage: number
): { damage: number; remainingHP: number; isDefeated: boolean } {
  const remainingHP = Math.max(0, bossCurrentHP - damage);
  return {
    damage,
    remainingHP,
    isDefeated: remainingHP === 0,
  };
}

// ===== 每日记录更新 =====

/**
 * 更新或创建每日记录
 */
export function updateDailyRecord(
  records: DailyRecord[],
  todayStr: string,
  pointsEarned: number
): DailyRecord[] {
  const existing = records.find(r => r.date === todayStr);
  if (existing) {
    return records.map(r =>
      r.date === todayStr
        ? { ...r, completedCount: r.completedCount + 1, pointsEarned: r.pointsEarned + pointsEarned }
        : r
    );
  }
  return [...records, { date: todayStr, completedCount: 1, pointsEarned }];
}

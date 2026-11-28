// ===== 任务相关类型 =====
export type TaskStatus = 'todo' | 'doing' | 'done' | 'daily' | 'shopping';
export type TaskPriority = 'high' | 'medium' | 'low' | null;
export type RepeatType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'weekdays' | 'workdays' | 'holidays';

// 日志类型：damage=伤害, task=任务完成, story=剧情
export type LogType = 'damage' | 'task' | 'story';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  categoryId: string | null;
  dueDate: string | null;       // ISO date string
  createdAt: string;            // ISO datetime
  completedAt: string | null;   // ISO datetime
  order: number;                // 排序
  repeat: RepeatType;           // 重复任务
  repeatWeekdays?: number[];    // 自定义周几重复 (0=周日, 1=周一, ..., 6=周六)
  repeatCount: number;          // 重复次数计数，第N次重复
  parentId: string | null;      // 父任务ID（子任务用）
  archived?: boolean;           // 是否已归档
  completedDates?: string[];    // 该任务被完成过的所有日期（YYYY-MM-DD，去重），用于每日/重复任务的日历统计
}

// ===== 分类 =====
export interface Category {
  id: string;
  name: string;
  color: string;
}

// ===== 知识库 =====
export interface Knowledge {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  link: string;                 // 文章链接 URL
  videoLink?: string;           // 视频链接 URL
  videoNote?: string;           // 视频笔记/文案
  createdAt: string;
  updatedAt: string;
}

// ===== 用户资料 =====
export interface UserProfile {
  totalPoints: number;
  level: number;
  completedTaskCount: number;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;  // YYYY-MM-DD
  coins: number;
  streakShields: number;            // 连续天数护盾数量
  pendingCoinDoubleTurns: number;   // 剩余金币翻倍任务数（0=无，>0 则每次完成任务金币翻倍并 -1）
  wheelRewardedCount: number;       // 今日轮盘已奖励的节点数（每天重置）
  wheelRewardDate: string | null;   // 轮盘奖励最后结算的日期 YYYY-MM-DD
}

// ===== 徽章 =====
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;  // 用于判定逻辑的 key
}

// 选项效果：wisdom=获得经验, favor=获得护盾（已完全移除金币相关选项）
export type ChapterEffectType = 'wisdom' | 'favor';

// ===== 冒险章节互动选项（全部免费、非伤害、非金币效果）=====
export interface ChapterOption {
  id: string;
  label: string;             // 选项名称
  description: string;       // 选项描述
  effect: ChapterEffectType; // 选项效果
  wisdomPoints?: number;     // wisdom：获得的经验值
  favorShields?: number;     // favor：连续天数护盾数量
  oneTime?: boolean;         // 是否每章只能使用一次
}

// ===== 故事支线 =====
export interface SideQuestOption {
  id: string;
  label: string;
  description: string;
  wisdomPoints?: number;
  favorShields?: number;
}

// 支线阶段：每个阶段需要完成若干任务解锁选项，选择后进入下一阶段（支线长度由此体现）
export interface SideQuestStage {
  id: string;
  text: string;                  // 本阶段剧情
  options: SideQuestOption[];    // 本阶段可选选项
  tasksRequired: number;         // 需完成的任务数来解锁本阶段选项（与任务进度关联）
}

export interface StorySideQuest {
  id: string;               // 唯一 id，如 'ch2-s1'
  chapterId: number;
  title: string;
  emoji: string;
  intro: string;            // 支线开场剧情
  stages: SideQuestStage[]; // 多阶段剧情，长度可变
}

// ===== 冒险章节 =====
export interface StoryChapter {
  id: number;
  title: string;
  area: string;
  condition: string;       // 推进条件 key
  conditionValue: number;  // 推进条件值
  bossName: string | null;
  bossHP: number;
  storyText: string;       // 章节剧情文本
  bossDefeatedText: string;
  options?: ChapterOption[];          // 章节互动选项（非伤害效果）
  sideQuests?: StorySideQuest[];      // 章节支线
}

export interface StoryProgress {
  currentChapter: number;      // 当前所在章节 (1-5)
  unlockedChapters: number[];  // 已解锁章节
  bossCurrentHP: Record<number, number>;  // 各章节 Boss 当前 HP
  defeatedBosses: number[];    // 已击败的 Boss 章节 id
  usedOptions?: Record<number, string[]>;  // 已使用的一次性章节选项，按章节记录
  // 支线进度
  unlockedSideQuests: string[];           // 已解锁的支线 id
  completedSideQuests: string[];          // 已完成的支线
  usedSideQuestOptions: Record<string, string[]>;  // 每条支线已使用的选项（按阶段选项 id）
  sideQuestStage: Record<string, number>;           // 每条支线当前阶段 index
  sideQuestTaskProgress: Record<string, number>;    // 每条支线当前阶段已积累的任务完成数
}

export interface StoryLog {
  id: string;
  chapterId: number;
  text: string;
  type: LogType;
  createdAt: string;
}

// ===== 便签 =====
export interface Note {
  id: string;
  content: string;
  color: string;        // 便签颜色
  createdAt: string;    // ISO datetime
  updatedAt: string;    // ISO datetime
}

// ===== 每日记录 =====
export interface DailyRecord {
  date: string;        // YYYY-MM-DD
  completedCount: number;
  pointsEarned: number;
}

// ===== 金币商店 =====
export type ShopEffect = 'streakShield' | 'coinDouble' | 'quickComplete';

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  cost: number;
  icon: string;       // 展示用 emoji
  effect: ShopEffect; // 实际效果
  enabled: boolean;
}

// ===== 家园农田 =====
export interface FarmPlot {
  id: number;
  crop: string | null; // 作物 key，null 表示空地
  progress: number;    // 已积累的任务数
  required: number;    // 成熟所需任务数
  cost: number;        // 种子花费
  reward: number;      // 收获金币
}

export interface FarmBuildings {
  barn: number;      // 谷仓：收获金币加成
  windmill: number;  // 风车：减少成熟所需任务
  workshop: number;  // 工坊：降低种子费用
}

// ===== Store 完整状态 =====
export interface AppData {
  tasks: Task[];
  categories: Category[];
  knowledge: Knowledge[];
  notes: Note[];
  userProfile: UserProfile;
  userBadges: string[];        // 已获得徽章 id
  dailyRecords: DailyRecord[];
  storyProgress: StoryProgress;
  storyLogs: StoryLog[];
  shopItems: ShopItem[];
  farm: FarmPlot[];
  farmBuildings: FarmBuildings;
}

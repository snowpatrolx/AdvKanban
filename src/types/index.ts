// ===== 任务相关类型 =====
export type TaskStatus = 'todo' | 'doing' | 'done' | 'daily';
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
  coins: number;                    // 金币（用于冒险章节互动选项）
}

// ===== 徽章 =====
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;  // 用于判定逻辑的 key
}

// 选项效果：damage=造成伤害, weaken=削弱 Boss（后续出手伤害提升）, loot=获得金币
export type ChapterEffectType = 'damage' | 'weaken' | 'loot';

// ===== 冒险章节互动选项 =====
export interface ChapterOption {
  id: string;
  label: string;       // 选项名称
  cost: number;        // 消耗金币
  damage: number;      // 对 Boss 造成的伤害（weaken/loot 为 0）
  description: string; // 选项描述
  effect?: ChapterEffectType;      // 选项效果，默认 damage
  weakenMultiplier?: number;       // weaken：后续出手伤害倍数，如 1.5
  weakenTurns?: number;            // weaken：生效次数
  lootCoins?: number;              // loot：获得的金币
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
  options?: ChapterOption[];  // 章节互动选项（消耗金币对 Boss 造成伤害）
}

export interface StoryProgress {
  currentChapter: number;      // 当前所在章节 (1-5)
  unlockedChapters: number[];  // 已解锁章节
  bossCurrentHP: Record<number, number>;  // 各章节 Boss 当前 HP
  defeatedBosses: number[];    // 已击败的 Boss 章节 id
  bossWeaken?: Record<number, { multiplier: number; remaining: number }>;  // Boss 被削弱的剩余出手次数
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
}

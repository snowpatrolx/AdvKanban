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

// 选项效果：loot=搜刮金币, wisdom=获得经验, favor=获得护盾, fortune=下次金币翻倍
export type ChapterEffectType = 'loot' | 'wisdom' | 'favor' | 'fortune';

// ===== 冒险章节互动选项（全部为非伤害效果）=====
export interface ChapterOption {
  id: string;
  label: string;             // 选项名称
  cost: number;              // 消耗金币
  description: string;       // 选项描述
  effect: ChapterEffectType; // 选项效果
  lootCoins?: number;        // loot：获得的金币
  wisdomPoints?: number;     // wisdom：获得的经验值
  favorShields?: number;     // favor：连续天数护盾数量
  fortuneTurns?: number;     // fortune：接下来 N 次任务金币翻倍
  oneTime?: boolean;         // 是否每章只能使用一次（默认 loot 为 true，其他为 false）
}

// ===== 故事支线 =====
export interface SideQuestOption {
  id: string;
  label: string;
  description: string;
  cost: number;
  lootCoins?: number;
  wisdomPoints?: number;
  favorShields?: number;
  fortuneTurns?: number;
}

export interface StorySideQuest {
  id: string;               // 唯一 id，如 'ch2-s1'
  chapterId: number;
  title: string;
  emoji: string;
  storyText: string;        // 支线剧情
  rewardCoins: number;      // 解锁支线即可获得的金币
  rewardPoints: number;     // 解锁支线即可获得的经验
  options: SideQuestOption[];
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
  usedOptions?: Record<number, string[]>;  // 已使用的一次性选项，按章节记录
  // 支线进度
  unlockedSideQuests: string[];           // 已解锁的支线 id
  completedSideQuests: string[];          // 已完成（全部选项都用过后）的支线
  usedSideQuestOptions: Record<string, string[]>;  // 每条支线已使用的选项
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

// ===== 任务相关类型 =====
export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low' | null;

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
}

// ===== 徽章 =====
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;  // 用于判定逻辑的 key
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
}

export interface StoryProgress {
  currentChapter: number;      // 当前所在章节 (1-5)
  unlockedChapters: number[];  // 已解锁章节
  bossCurrentHP: Record<number, number>;  // 各章节 Boss 当前 HP
  defeatedBosses: number[];    // 已击败的 Boss 章节 id
}

export interface StoryLog {
  id: string;
  chapterId: number;
  text: string;
  createdAt: string;
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
  userProfile: UserProfile;
  userBadges: string[];        // 已获得徽章 id
  dailyRecords: DailyRecord[];
  storyProgress: StoryProgress;
  storyLogs: StoryLog[];
}

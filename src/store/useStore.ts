import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Task, Category, Knowledge, Note, UserProfile, StoryProgress, StoryLog, DailyRecord,
  TaskStatus, TaskPriority, RepeatType, LogType,
} from '../types';
import { generateId, getTodayStr } from '../utils/id';
import {
  calculateTaskPoints, getLevelByPoints, updateStreak, checkAllBadges,
  checkChapterCondition, calculateBossDamage, updateDailyRecord,
} from '../utils/gamification';
import { advanceOccurrence, nextOccurrenceOnOrAfter } from '../utils/taskHelpers';
import { CHAPTERS } from '../data/chapters';
import { BADGES } from '../data/badges';

interface StoreState {
  tasks: Task[];
  categories: Category[];
  knowledge: Knowledge[];
  notes: Note[];
  userProfile: UserProfile;
  userBadges: string[];
  dailyRecords: DailyRecord[];
  storyProgress: StoryProgress;
  storyLogs: StoryLog[];

  // 任务操作
  addTask: (data: Partial<Task>) => string;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskComplete: (id: string) => { pointsEarned: number; newBadges: string[]; bossDefeated: boolean; storyUnlocked: number | null };
  reorderTasks: (sourceId: string, targetId: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  archiveTask: (id: string) => void;
  unarchiveTask: (id: string) => void;
  archiveCompletedTasks: () => number;

  // 子任务操作
  addSubtask: (parentId: string, title: string) => string;
  updateSubtask: (id: string, data: Partial<Task>) => void;
  deleteSubtask: (id: string) => void;
  toggleSubtask: (id: string) => { bossDamage: number; bossDefeated: boolean; storyUnlocked: number | null };

  // 分类操作
  addCategory: (name: string, color: string) => string;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // 知识库操作
  addKnowledge: (data: Partial<Knowledge>) => string;
  updateKnowledge: (id: string, data: Partial<Knowledge>) => void;
  deleteKnowledge: (id: string) => void;

  // 便签操作
  addNote: (content: string, color?: string) => string;
  updateNote: (id: string, data: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  noteToTask: (id: string) => string | null;

  // 数据管理
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
  resetAll: () => void;

  // 同步重复任务日期（把已过期但未完成的重复任务滚动到下一次执行日期）
  syncRepeatDates: () => void;

  // 互动
  adventureInteract: (chapterId: number, action: string) => { bossDamage: number; message: string; bossDefeated: boolean };

  // 内部
  _processTaskCompletion: (task: Task) => { pointsEarned: number; newBadges: string[]; bossDefeated: boolean; storyUnlocked: number | null };
  _processSubtaskCompletion: (subtask: Task) => { bossDamage: number; bossDefeated: boolean; storyUnlocked: number | null };
}

export const APP_VERSION = '1.13';

const defaultCategories: Category[] = [
  { id: 'cat-home', name: 'home', color: '#e17055' },
  { id: 'cat-solo', name: 'solo', color: '#6c5ce7' },
  { id: 'cat-out', name: 'out', color: '#00b894' },
  { id: 'cat-any', name: 'any', color: '#0984e3' },
];

// any 分类 ID，属于所有分类
export const ANY_CATEGORY_ID = 'cat-any';

// 旧分类ID到新分类ID的映射
const categoryIdMap: Record<string, string> = {
  'cat-orange': 'cat-home',
  'cat-alone': 'cat-solo',
  'cat-outwork': 'cat-out',
};

const seedKnowledge: Knowledge[] = [
  {
    id: 'seed-k1',
    title: '番茄工作法',
    content: '番茄工作法是一种时间管理方法：\n\n1. 选择一个待完成的任务\n2. 设定25分钟计时（一个番茄钟）\n3. 专注工作，直到计时结束\n4. 休息5分钟\n5. 每完成4个番茄钟，休息15-30分钟\n\n核心理念：在一段时间内保持完全专注，避免多任务切换带来的效率损失。',
    categoryId: 'cat-solo',
    link: 'https://francescocirillo.com/products/the-pomodoro-technique',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z',
  },
  {
    id: 'seed-k2',
    title: 'GTD 任务管理法',
    content: 'Getting Things Done（GTD）五步法：\n\n1. 捕获：将所有想法和任务记录下来\n2. 澄清：判断每个项目是否可执行\n3. 组织：将任务分类到不同清单\n4. 反思：定期回顾和更新\n5. 执行：根据情境选择合适的任务执行\n\n关键原则：大脑是用来思考的，不是用来记忆的。',
    categoryId: 'cat-out',
    link: 'https://gettingthingsdone.com/what-is-gtd/',
    createdAt: '2026-08-02T10:00:00.000Z',
    updatedAt: '2026-08-02T10:00:00.000Z',
  },
  {
    id: 'seed-k3',
    title: '橙橙日常照护要点',
    content: '橙橙在家的日常注意事项：\n\n- 定时喂食，每天2次，早晚各一次\n- 保证充足饮水，每天换新鲜水\n- 每天至少陪伴互动30分钟\n- 注意室内温度，保持在22-26度\n- 定期检查猫砂盆，保持清洁\n- 注意观察精神状态和食欲变化',
    categoryId: 'cat-home',
    link: '',
    createdAt: '2026-08-03T09:00:00.000Z',
    updatedAt: '2026-08-03T09:00:00.000Z',
  },
  {
    id: 'seed-k4',
    title: '艾森豪威尔矩阵',
    content: '四象限任务分类法：\n\n- 重要且紧急：立即亲自做（危机、截止日期）\n- 重要不紧急：计划安排做（学习、锻炼、规划）\n- 紧急不重要：委托别人做（部分会议、电话）\n- 不紧急不重要：尽量减少（刷手机、无意义娱乐）\n\n高效人士把更多时间花在「重要不紧急」的第二象限。',
    categoryId: 'cat-out',
    link: 'https://www.eisenhower.me/eisenhower-matrix/',
    createdAt: '2026-08-04T14:00:00.000Z',
    updatedAt: '2026-08-04T14:00:00.000Z',
  },
  {
    id: 'seed-k5',
    title: '独自在家效率指南',
    content: '居家独自工作时保持高效的方法：\n\n1. 固定工作区域，与休息区分开\n2. 穿着正式些，营造工作仪式感\n3. 制定每日计划，列出3件最重要的事\n4. 使用番茄钟保持专注\n5. 午休不超过30分钟\n6. 设定下班时间，工作生活分离\n7. 适当背景音乐，避免太安静',
    categoryId: 'cat-solo',
    link: '',
    createdAt: '2026-08-05T11:00:00.000Z',
    updatedAt: '2026-08-05T11:00:00.000Z',
  },
];

const defaultUserProfile: UserProfile = {
  totalPoints: 0,
  level: 1,
  completedTaskCount: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
};

const defaultStoryProgress: StoryProgress = {
  currentChapter: 1,
  unlockedChapters: [1],
  bossCurrentHP: {},
  defeatedBosses: [],
};

// 创建故事日志的辅助函数
function createLog(chapterId: number, text: string, type: LogType): StoryLog {
  return {
    id: generateId(),
    chapterId,
    text,
    type,
    createdAt: new Date().toISOString(),
  };
}

// 计算重复任务的下一个截止日期（为新创建的重复任务设定对应日期）
function getNextDueDate(
  dueDate: string | null,
  repeat: RepeatType,
  repeatWeekdays?: number[],
): string | null {
  if (repeat === 'none') return dueDate;
  // 没有日期时，以今天为基准计算，保证新的重复任务始终有明确的日期
  const base = dueDate ? dueDate.substring(0, 10) : getTodayStr();
  return advanceOccurrence(base, repeat, repeatWeekdays);
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      tasks: [],
      categories: defaultCategories,
      knowledge: seedKnowledge,
      notes: [],
      userProfile: defaultUserProfile,
      userBadges: [],
      dailyRecords: [],
      storyProgress: defaultStoryProgress,
      storyLogs: [],

      // ===== 任务操作 =====
      addTask: (data) => {
        const id = generateId();
        const now = new Date().toISOString();
        const maxOrder = get().tasks.reduce((max, t) => Math.max(max, t.order), 0);
        const task: Task = {
          id,
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'todo',
          priority: data.priority !== undefined ? data.priority : null,
          categoryId: data.categoryId || null,
          dueDate: data.dueDate || null,
          createdAt: now,
          completedAt: null,
          order: maxOrder + 1,
          repeat: data.repeat || 'none',
          repeatWeekdays: data.repeatWeekdays,
          repeatCount: data.repeatCount ?? 0,
          parentId: data.parentId || null,
        };
        set(state => ({ tasks: [...state.tasks, task] }));
        return id;
      },

      updateTask: (id, data) => {
        set(state => ({
          tasks: state.tasks.map(t => t.id === id ? { ...t, ...data } : t),
        }));
      },

      deleteTask: (id) => {
        set(state => ({
          // 删除任务及其所有子任务
          tasks: state.tasks.filter(t => t.id !== id && t.parentId !== id),
        }));
      },

      toggleTaskComplete: (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task) return { pointsEarned: 0, newBadges: [], bossDefeated: false, storyUnlocked: null };

        if (task.status === 'done') {
          // 取消完成
          set(state => ({
            tasks: state.tasks.map(t =>
              t.id === id ? { ...t, status: 'todo' as TaskStatus, completedAt: null } : t
            ),
          }));
          return { pointsEarned: 0, newBadges: [], bossDefeated: false, storyUnlocked: null };
        }

        return get()._processTaskCompletion(task);
      },

      _processTaskCompletion: (task) => {
        const state = get();
        const todayStr = getTodayStr();
        const profile = state.userProfile;

        // 计算积分
        const { total: pointsEarned } = calculateTaskPoints(task.priority, profile.currentStreak);

        // 更新连续天数
        const newStreak = updateStreak(profile.lastCompletedDate, todayStr, profile.currentStreak);
        const newLongestStreak = Math.max(profile.longestStreak, newStreak);

        // 更新每日记录
        const newDailyRecords = updateDailyRecord(state.dailyRecords, todayStr, pointsEarned);

        // 更新任务状态
        let updatedTasks = state.tasks.map(t =>
          t.id === task.id
            ? { ...t, status: 'done' as TaskStatus, completedAt: new Date().toISOString() }
            : t
        );

        // 如果是重复任务，创建下一个周期的新任务（保留原有任务状态）
        if (task.repeat !== 'none' && !task.parentId) {
          const nextDue = getNextDueDate(task.dueDate, task.repeat, task.repeatWeekdays);
          const nextCount = (task.repeatCount || 0) + 1;
          const newTask: Task = {
            ...task,
            id: generateId(),
            status: task.status, // 保留原有的任务状态（todo/doing）
            completedAt: null,
            dueDate: nextDue,
            createdAt: new Date().toISOString(),
            repeatCount: nextCount,
          };
          updatedTasks = [...updatedTasks, newTask];
        }

        // 更新用户资料
        const newCompletedCount = profile.completedTaskCount + 1;
        const newTotalPoints = profile.totalPoints + pointsEarned;
        const newLevel = getLevelByPoints(newTotalPoints).level;

        // Boss 战逻辑
        let bossDefeated = false;
        let storyUnlocked: number | null = null;
        const newStoryProgress = { ...state.storyProgress };
        const newStoryLogs = [...state.storyLogs];

        const currentChapter = CHAPTERS.find(c => c.id === newStoryProgress.currentChapter);
        if (currentChapter && currentChapter.bossName) {
          const bossMaxHP = currentChapter.bossHP;
          const bossCurrentHP = newStoryProgress.bossCurrentHP[currentChapter.id] ?? bossMaxHP;
          const result = calculateBossDamage(bossMaxHP, bossCurrentHP, pointsEarned);

          newStoryProgress.bossCurrentHP = {
            ...newStoryProgress.bossCurrentHP,
            [currentChapter.id]: result.remainingHP,
          };

          newStoryLogs.push(createLog(
            currentChapter.id,
            `你完成了「${task.title}」，对${currentChapter.bossName}造成 ${pointsEarned} 点伤害！`,
            'damage',
          ));

          if (result.isDefeated) {
            bossDefeated = true;
            newStoryProgress.defeatedBosses = [...newStoryProgress.defeatedBosses, currentChapter.id];
            newStoryLogs.push(createLog(
              currentChapter.id,
              currentChapter.bossDefeatedText,
              'story',
            ));

            const nextChapter = CHAPTERS.find(c => c.id === currentChapter.id + 1);
            if (nextChapter) {
              newStoryProgress.currentChapter = nextChapter.id;
              newStoryProgress.unlockedChapters = [...newStoryProgress.unlockedChapters, nextChapter.id];
              storyUnlocked = nextChapter.id;
              newStoryLogs.push(createLog(
                nextChapter.id,
                nextChapter.storyText,
                'story',
              ));
            } else {
              storyUnlocked = 0;
              newStoryLogs.push(createLog(
                currentChapter.id,
                '恭喜你！你已通关全部章节，成为了真正的秩序守护者！',
                'story',
              ));
            }
          }
        } else if (currentChapter) {
          const ctx = {
            completedTaskCount: newCompletedCount,
            knowledgeCount: state.knowledge.length,
            currentStreak: newStreak,
          };
          if (checkChapterCondition(currentChapter.condition, currentChapter.conditionValue, ctx)) {
            const nextChapter = CHAPTERS.find(c => c.id === currentChapter.id + 1);
            if (nextChapter) {
              newStoryProgress.currentChapter = nextChapter.id;
              newStoryProgress.unlockedChapters = [...newStoryProgress.unlockedChapters, nextChapter.id];
              storyUnlocked = nextChapter.id;
              newStoryLogs.push(createLog(
                nextChapter.id,
                nextChapter.storyText,
                'story',
              ));
            }
          }

          newStoryLogs.push(createLog(
            currentChapter.id,
            `你完成了「${task.title}」，获得了 ${pointsEarned} 点经验值。`,
            'task',
          ));
        }

        if (!bossDefeated && storyUnlocked === null) {
          const checkChapter = CHAPTERS.find(c => c.id === newStoryProgress.currentChapter);
          if (checkChapter && !checkChapter.bossName) {
            const ctx = {
              completedTaskCount: newCompletedCount,
              knowledgeCount: state.knowledge.length,
              currentStreak: newStreak,
            };
            if (checkChapterCondition(checkChapter.condition, checkChapter.conditionValue, ctx)) {
              const nextChapter = CHAPTERS.find(c => c.id === checkChapter.id + 1);
              if (nextChapter && !newStoryProgress.unlockedChapters.includes(nextChapter.id)) {
                newStoryProgress.currentChapter = nextChapter.id;
                newStoryProgress.unlockedChapters = [...newStoryProgress.unlockedChapters, nextChapter.id];
                storyUnlocked = nextChapter.id;
                newStoryLogs.push(createLog(
                  nextChapter.id,
                  nextChapter.storyText,
                  'story',
                ));
              }
            }
          }
        }

        const newProfile: UserProfile = {
          ...profile,
          totalPoints: newTotalPoints,
          level: newLevel,
          completedTaskCount: newCompletedCount,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastCompletedDate: todayStr,
        };

        const storyComplete = newStoryProgress.defeatedBosses.length === CHAPTERS.filter(c => c.bossName).length
          && CHAPTERS.every(c => newStoryProgress.unlockedChapters.includes(c.id));
        const newBadges = checkAllBadges(state.userBadges, {
          completedTaskCount: newCompletedCount,
          knowledgeCount: state.knowledge.length,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          storyComplete,
        });

        set({
          tasks: updatedTasks,
          userProfile: newProfile,
          dailyRecords: newDailyRecords,
          storyProgress: newStoryProgress,
          storyLogs: newStoryLogs,
          userBadges: [...state.userBadges, ...newBadges],
        });

        return { pointsEarned, newBadges, bossDefeated, storyUnlocked };
      },

      reorderTasks: (sourceId, targetId) => {
        set(state => {
          const tasks = [...state.tasks].sort((a, b) => a.order - b.order);
          const sourceIdx = tasks.findIndex(t => t.id === sourceId);
          const targetIdx = tasks.findIndex(t => t.id === targetId);
          if (sourceIdx === -1 || targetIdx === -1) return {};
          const [moved] = tasks.splice(sourceIdx, 1);
          tasks.splice(targetIdx, 0, moved);
          tasks.forEach((t, i) => { t.order = i + 1; });
          return { tasks };
        });
      },

      setTaskStatus: (id, status) => {
        const state = get();
        const task = state.tasks.find(t => t.id === id);
        if (!task) return;

        if (status === 'done' && task.status !== 'done') {
          get()._processTaskCompletion(task);
        } else if (status !== 'done' && task.status === 'done') {
          set(s => ({
            tasks: s.tasks.map(t =>
              t.id === id ? { ...t, status, completedAt: null } : t
            ),
          }));
        } else {
          set(s => ({
            tasks: s.tasks.map(t => t.id === id ? { ...t, status } : t),
          }));
        }
      },

      // ===== 归档操作 =====
      archiveTask: (id) => set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, archived: true } : t),
      })),

      unarchiveTask: (id) => set(state => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, archived: false } : t),
      })),

      archiveCompletedTasks: () => {
        const state = get();
        const toArchive = state.tasks.filter(t =>
          !t.parentId && t.status === 'done' && !t.archived
        );
        const archivedIds = new Set(toArchive.map(t => t.id));
        set({
          tasks: state.tasks.map(t =>
            archivedIds.has(t.id) ? { ...t, archived: true } : t
          ),
        });
        return toArchive.length;
      },

      // ===== 子任务操作 =====
      addSubtask: (parentId, title) => {
        const id = generateId();
        const now = new Date().toISOString();
        const parent = get().tasks.find(t => t.id === parentId);
        const subtaskOrder = get().tasks.filter(t => t.parentId === parentId).length;
        const task: Task = {
          id,
          title: title.trim(),
          description: '',
          status: 'todo',
          priority: parent?.priority || null,
          categoryId: parent?.categoryId || null,
          dueDate: parent?.dueDate || null,
          createdAt: now,
          completedAt: null,
          order: subtaskOrder + 1,
          repeat: 'none',
          repeatCount: 0,
          parentId,
        };
        set(state => ({ tasks: [...state.tasks, task] }));
        return id;
      },

      updateSubtask: (id, data) => {
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === id && t.parentId ? { ...t, ...data } : t
          ),
        }));
      },

      deleteSubtask: (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task || !task.parentId) return;
        set(state => ({
          tasks: state.tasks.filter(t => t.id !== id),
        }));
      },

      toggleSubtask: (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (!task || !task.parentId) return { bossDamage: 0, bossDefeated: false, storyUnlocked: null };

        if (task.status === 'done') {
          // 取消完成子任务
          set(state => ({
            tasks: state.tasks.map(t =>
              t.id === id ? { ...t, status: 'todo' as TaskStatus, completedAt: null } : t
            ),
          }));
          return { bossDamage: 0, bossDefeated: false, storyUnlocked: null };
        } else {
          // 完成子任务：更新状态
          set(state => ({
            tasks: state.tasks.map(t =>
              t.id === id ? { ...t, status: 'done' as TaskStatus, completedAt: new Date().toISOString() } : t
            ),
          }));

          // 子任务完成也会对 Boss 造成伤害
          const result = get()._processSubtaskCompletion(task);

          // 检查是否所有子任务都完成了
          const siblings = get().tasks.filter(t => t.parentId === task.parentId);
          const allDone = siblings.every(t => t.status === 'done');
          if (allDone) {
            // 自动完成父任务并触发积分逻辑
            const parentResult = get()._processTaskCompletion(get().tasks.find(t => t.id === task.parentId)!);
            // 合并结果：如果子任务已经击败了 boss，不再重复报告
            return {
              bossDamage: result.bossDamage,
              bossDefeated: result.bossDefeated || parentResult.bossDefeated,
              storyUnlocked: result.storyUnlocked || parentResult.storyUnlocked,
            };
          }

          return result;
        }
      },

      _processSubtaskCompletion: (subtask) => {
        const state = get();
        const parentTask = state.tasks.find(t => t.id === subtask.parentId);
        if (!parentTask) return { bossDamage: 0, bossDefeated: false, storyUnlocked: null };

        // 子任务伤害 = 父任务基础积分的一半
        const basePoints = parentTask.priority === 'high' ? 10 : 5;
        const bossDamage = basePoints;

        let bossDefeated = false;
        let storyUnlocked: number | null = null;
        const newStoryProgress = { ...state.storyProgress };
        const newStoryLogs = [...state.storyLogs];

        const currentChapter = CHAPTERS.find(c => c.id === newStoryProgress.currentChapter);
        if (currentChapter && currentChapter.bossName) {
          const bossMaxHP = currentChapter.bossHP;
          const bossCurrentHP = newStoryProgress.bossCurrentHP[currentChapter.id] ?? bossMaxHP;
          const result = calculateBossDamage(bossMaxHP, bossCurrentHP, bossDamage);

          newStoryProgress.bossCurrentHP = {
            ...newStoryProgress.bossCurrentHP,
            [currentChapter.id]: result.remainingHP,
          };

          newStoryLogs.push(createLog(
            currentChapter.id,
            `你完成了子任务「${subtask.title}」，对${currentChapter.bossName}造成 ${bossDamage} 点伤害！`,
            'damage',
          ));

          if (result.isDefeated) {
            bossDefeated = true;
            newStoryProgress.defeatedBosses = [...newStoryProgress.defeatedBosses, currentChapter.id];
            newStoryLogs.push(createLog(
              currentChapter.id,
              currentChapter.bossDefeatedText,
              'story',
            ));

            const nextChapter = CHAPTERS.find(c => c.id === currentChapter.id + 1);
            if (nextChapter) {
              newStoryProgress.currentChapter = nextChapter.id;
              newStoryProgress.unlockedChapters = [...newStoryProgress.unlockedChapters, nextChapter.id];
              storyUnlocked = nextChapter.id;
              newStoryLogs.push(createLog(
                nextChapter.id,
                nextChapter.storyText,
                'story',
              ));
            }
          }
        }

        set({
          storyProgress: newStoryProgress,
          storyLogs: newStoryLogs,
        });

        return { bossDamage, bossDefeated, storyUnlocked };
      },

      // ===== 分类操作 =====
      addCategory: (name, color) => {
        const id = generateId();
        set(state => ({
          categories: [...state.categories, { id, name, color }],
        }));
        return id;
      },

      updateCategory: (id, data) => {
        set(state => ({
          categories: state.categories.map(c => c.id === id ? { ...c, ...data } : c),
        }));
      },

      deleteCategory: (id) => {
        // 不允许删除 any 分类
        if (id === ANY_CATEGORY_ID) return;
        set(state => ({
          categories: state.categories.filter(c => c.id !== id),
          tasks: state.tasks.map(t => t.categoryId === id ? { ...t, categoryId: null } : t),
          knowledge: state.knowledge.map(k => k.categoryId === id ? { ...k, categoryId: null } : k),
        }));
      },

      // ===== 知识库操作 =====
      addKnowledge: (data) => {
        const id = generateId();
        const now = new Date().toISOString();
        const item: Knowledge = {
          id,
          title: data.title || '',
          content: data.content || '',
          categoryId: data.categoryId || null,
          link: data.link || '',
          videoLink: data.videoLink || '',
          videoNote: data.videoNote || '',
          createdAt: now,
          updatedAt: now,
        };
        set(state => {
          const newKnowledge = [...state.knowledge, item];
          const newBadges = checkAllBadges(state.userBadges, {
            completedTaskCount: state.userProfile.completedTaskCount,
            knowledgeCount: newKnowledge.length,
            currentStreak: state.userProfile.currentStreak,
            longestStreak: state.userProfile.longestStreak,
            storyComplete: false,
          });
          return {
            knowledge: newKnowledge,
            userBadges: [...state.userBadges, ...newBadges],
          };
        });
        return id;
      },

      updateKnowledge: (id, data) => {
        set(state => ({
          knowledge: state.knowledge.map(k =>
            k.id === id ? { ...k, ...data, updatedAt: new Date().toISOString() } : k
          ),
        }));
      },

      deleteKnowledge: (id) => {
        set(state => ({ knowledge: state.knowledge.filter(k => k.id !== id) }));
      },

      // ===== 便签操作 =====
      addNote: (content, color) => {
        const id = generateId();
        const now = new Date().toISOString();
        const note: Note = {
          id,
          content: content.trim(),
          color: color || '#ffd93d',
          createdAt: now,
          updatedAt: now,
        };
        set(state => ({ notes: [note, ...state.notes] }));
        return id;
      },

      updateNote: (id, data) => {
        set(state => ({
          notes: state.notes.map(n =>
            n.id === id ? { ...n, ...data, updatedAt: new Date().toISOString() } : n
          ),
        }));
      },

      deleteNote: (id) => {
        set(state => ({ notes: state.notes.filter(n => n.id !== id) }));
      },

      // 便签转换为任务
      noteToTask: (id) => {
        const note = get().notes.find(n => n.id === id);
        if (!note || !note.content.trim()) return null;

        const lines = note.content.split('\n').map(l => l.trim()).filter(Boolean);
        const title = lines[0] || note.content.trim();
        const description = lines.slice(1).join('\n');

        const taskId = get().addTask({
          title,
          description,
          status: 'todo',
        });

        set(state => ({ notes: state.notes.filter(n => n.id !== id) }));
        return taskId;
      },

      // 把已过期但未完成的重复任务滚动到下一次执行日期
      syncRepeatDates: () => {
        const todayStr = getTodayStr();
        set(state => ({
          tasks: state.tasks.map(t => {
            if (t.repeat === 'none' || t.status === 'done' || t.archived || t.parentId) return t;
            if (!t.dueDate) return t;
            const next = nextOccurrenceOnOrAfter(t.dueDate, t.repeat, t.repeatWeekdays, todayStr);
            if (!next || next === t.dueDate.substring(0, 10)) return t;
            return { ...t, dueDate: next };
          }),
        }));
      },

      // ===== 数据管理 =====
      exportJSON: () => {
        const state = get();
        const data = {
          tasks: state.tasks,
          categories: state.categories,
          knowledge: state.knowledge,
          notes: state.notes,
          userProfile: state.userProfile,
          userBadges: state.userBadges,
          dailyRecords: state.dailyRecords,
          storyProgress: state.storyProgress,
          storyLogs: state.storyLogs,
          exportTime: new Date().toISOString(),
          version: APP_VERSION,
        };
        return JSON.stringify(data, null, 2);
      },

      importJSON: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            tasks: data.tasks || [],
            categories: data.categories || defaultCategories,
            knowledge: data.knowledge || [],
            notes: data.notes || [],
            userProfile: data.userProfile || defaultUserProfile,
            userBadges: data.userBadges || [],
            dailyRecords: data.dailyRecords || [],
            storyProgress: data.storyProgress || defaultStoryProgress,
            storyLogs: data.storyLogs || [],
          });
          return true;
        } catch {
          return false;
        }
      },

      resetAll: () => {
        set({
          tasks: [],
          categories: defaultCategories,
          knowledge: seedKnowledge,
          notes: [],
          userProfile: defaultUserProfile,
          userBadges: [],
          dailyRecords: [],
          storyProgress: defaultStoryProgress,
          storyLogs: [],
        });
      },

      adventureInteract: (chapterId, action) => {
        const state = get();
        const chapter = CHAPTERS.find(c => c.id === chapterId);
        if (!chapter || !chapter.bossName) {
          return { bossDamage: 0, message: '该章节没有 Boss', bossDefeated: false };
        }

        // 检查 Boss 是否已被击败
        if (state.storyProgress.defeatedBosses.includes(chapterId)) {
          return { bossDamage: 0, message: `${chapter.bossName} 已被击败`, bossDefeated: false };
        }

        // 检查是否是当前章节
        if (state.storyProgress.currentChapter !== chapterId) {
          return { bossDamage: 0, message: '该章节尚未解锁', bossDefeated: false };
        }

        // 根据不同互动类型计算伤害
        let bossDamage = 0;
        let message = '';

        switch (action) {
          case 'attack': {
            // 攻击：随机 5-15 点伤害
            bossDamage = Math.floor(Math.random() * 11) + 5;
            message = `你对 ${chapter.bossName} 发动攻击，造成 ${bossDamage} 点伤害！`;
            break;
          }
          case 'skill': {
            // 技能：消耗经验值，造成 20-30 点伤害
            const cost = 10;
            if (state.userProfile.totalPoints < cost) {
              return { bossDamage: 0, message: '经验值不足，需要 10 点经验来释放技能', bossDefeated: false };
            }
            bossDamage = Math.floor(Math.random() * 11) + 20;
            message = `你释放了强力技能，对 ${chapter.bossName} 造成 ${bossDamage} 点伤害！消耗 ${cost} 经验值`;

            // 扣除经验值
            set(s => ({
              userProfile: {
                ...s.userProfile,
                totalPoints: Math.max(0, s.userProfile.totalPoints - cost),
              },
            }));
            break;
          }
          case 'defend': {
            // 防御：减少下次受击，但可以获得少量反击伤害
            bossDamage = Math.floor(Math.random() * 6) + 3;
            message = `你举盾防御并反击，对 ${chapter.bossName} 造成 ${bossDamage} 点伤害！`;
            break;
          }
          default:
            return { bossDamage: 0, message: '未知操作', bossDefeated: false };
        }

        // 计算 Boss 剩余 HP
        const bossMaxHP = chapter.bossHP;
        const currentHP = state.storyProgress.bossCurrentHP[chapterId] ?? bossMaxHP;
        const newHP = Math.max(0, currentHP - bossDamage);
        const bossDefeated = newHP === 0;

        // 更新状态
        set(s => {
          const newStoryProgress = { ...s.storyProgress };
          newStoryProgress.bossCurrentHP = {
            ...newStoryProgress.bossCurrentHP,
            [chapterId]: newHP,
          };

          const newStoryLogs = [...s.storyLogs];
          newStoryLogs.push({
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            chapterId,
            type: 'damage' as LogType,
            text: message,
            createdAt: new Date().toISOString(),
          });

          if (bossDefeated && !newStoryProgress.defeatedBosses.includes(chapterId)) {
            newStoryProgress.defeatedBosses = [...newStoryProgress.defeatedBosses, chapterId];
            newStoryLogs.push({
              id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-defeat`,
              chapterId,
              type: 'story' as LogType,
              text: `你成功击败了 ${chapter.bossName}！新的冒险篇章即将开启...`,
              createdAt: new Date().toISOString(),
            });

            // 解锁下一章
            const nextChapter = CHAPTERS.find(c => c.id === chapterId + 1);
            if (nextChapter && !newStoryProgress.unlockedChapters.includes(nextChapter.id)) {
              newStoryProgress.unlockedChapters = [...newStoryProgress.unlockedChapters, nextChapter.id];
              newStoryProgress.currentChapter = nextChapter.id;
            }
          }

          return {
            storyProgress: newStoryProgress,
            storyLogs: newStoryLogs,
          };
        });

        return { bossDamage, message, bossDefeated };
      },
    }),
    {
      name: 'quest-planner-storage',
      version: 6,
      migrate: (persistedState: any, version: number) => {
        let state = { ...persistedState };

        // v1/v2 -> v3: update categories, add new task fields, add knowledge link
        if (version < 3) {
          if (state.categories) {
            state.categories = defaultCategories;
          }
          if (state.tasks) {
            state.tasks = state.tasks.map((t: any) => ({
              ...t,
              repeat: t.repeat || 'none',
              parentId: t.parentId || null,
              categoryId: t.categoryId ? (categoryIdMap[t.categoryId] || t.categoryId) : null,
            }));
          }
          if (state.knowledge) {
            state.knowledge = state.knowledge.map((k: any) => ({
              ...k,
              link: k.link || '',
              categoryId: k.categoryId ? (categoryIdMap[k.categoryId] || k.categoryId) : null,
            }));
            if (state.knowledge.length === 0) {
              state.knowledge = seedKnowledge;
            }
          }
        }

        // v3 -> v4: add 'any' category, add new repeat fields
        if (version < 4) {
          if (state.categories) {
            const hasAny = state.categories.some((c: any) => c.id === 'cat-any');
            if (!hasAny) {
              state.categories = [...state.categories, { id: 'cat-any', name: 'any', color: '#0984e3' }];
            }
          }
          if (state.tasks) {
            state.tasks = state.tasks.map((t: any) => ({
              ...t,
              repeatWeekdays: t.repeatWeekdays || undefined,
              repeatDates: t.repeatDates || undefined,
            }));
          }
        }

        // v4 -> v5: migrate 'custom' repeat type to 'holidays', add log type field
        if (version < 5) {
          if (state.tasks) {
            state.tasks = state.tasks.map((t: any) => {
              let repeat = t.repeat;
              // 'custom' 类型迁移到 'holidays'
              if (repeat === 'custom') repeat = 'holidays';
              // 清理 repeatDates 字段（不再需要）
              const { repeatDates, ...rest } = t;
              return { ...rest, repeat };
            });
          }
          // 为已有日志添加 type 字段
          if (state.storyLogs) {
            state.storyLogs = state.storyLogs.map((log: any) => {
              if (log.type) return log;
              // 根据文本内容推断类型
              if (log.text.includes('伤害')) return { ...log, type: 'damage' };
              if (log.text.includes('完成了') || log.text.includes('经验值')) return { ...log, type: 'task' };
              return { ...log, type: 'story' };
            });
          }
        }

        // v5 -> v6: 新增便签数据
        if (version < 6) {
          if (!state.notes) {
            state.notes = [];
          }
        }

        return state;
      },
      onRehydrateStorage: () => (state) => {
        // 水合完成后，自动归档超过两周的已完成任务
        if (state && state.tasks) {
          const twoWeeksAgo = new Date();
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          const cutoffStr = twoWeeksAgo.toISOString();

          const toArchive = state.tasks.filter(t =>
            !t.parentId && t.status === 'done' && !t.archived &&
            t.completedAt && t.completedAt < cutoffStr
          );

          if (toArchive.length > 0) {
            const archivedIds = new Set(toArchive.map(t => t.id));
            state.tasks = state.tasks.map(t =>
              archivedIds.has(t.id) ? { ...t, archived: true } : t
            );
          }

          // 同步重复任务日期：已过期但未完成的重复任务滚动到下一次执行日期
          const todayStr = getTodayStr();
          state.tasks = state.tasks.map(t => {
            if (t.repeat === 'none' || t.status === 'done' || t.archived || t.parentId) return t;
            if (!t.dueDate) return t;
            const next = nextOccurrenceOnOrAfter(t.dueDate, t.repeat, t.repeatWeekdays, todayStr);
            if (!next || next === t.dueDate.substring(0, 10)) return t;
            return { ...t, dueDate: next };
          });
        }
      },
    }
  )
);

// 辅助导出
export { BADGES, CHAPTERS };

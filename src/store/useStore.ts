import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Task, Category, Knowledge, UserProfile, StoryProgress, StoryLog, DailyRecord,
  TaskStatus, TaskPriority,
} from '../types';
import { generateId, getTodayStr } from '../utils/id';
import {
  calculateTaskPoints, getLevelByPoints, updateStreak, checkAllBadges,
  checkChapterCondition, calculateBossDamage, updateDailyRecord,
} from '../utils/gamification';
import { CHAPTERS } from '../data/chapters';
import { BADGES } from '../data/badges';

interface StoreState {
  tasks: Task[];
  categories: Category[];
  knowledge: Knowledge[];
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

  // 分类操作
  addCategory: (name: string, color: string) => string;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // 知识库操作
  addKnowledge: (data: Partial<Knowledge>) => string;
  updateKnowledge: (id: string, data: Partial<Knowledge>) => void;
  deleteKnowledge: (id: string) => void;

  // 数据管理
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
  resetAll: () => void;

  // 内部
  _processTaskCompletion: (task: Task) => { pointsEarned: number; newBadges: string[]; bossDefeated: boolean; storyUnlocked: number | null };
}

export const APP_VERSION = '1.00';

const defaultCategories: Category[] = [
  { id: 'cat-orange', name: '橙橙在家', color: '#e17055' },
  { id: 'cat-alone', name: '独自在家', color: '#6c5ce7' },
  { id: 'cat-outwork', name: '外出工作', color: '#00b894' },
];

const seedKnowledge: Knowledge[] = [
  {
    id: 'seed-k1',
    title: '番茄工作法',
    content: '番茄工作法是一种时间管理方法：\n\n1. 选择一个待完成的任务\n2. 设定25分钟计时（一个番茄钟）\n3. 专注工作，直到计时结束\n4. 休息5分钟\n5. 每完成4个番茄钟，休息15-30分钟\n\n核心理念：在一段时间内保持完全专注，避免多任务切换带来的效率损失。',
    categoryId: 'cat-alone',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z',
  },
  {
    id: 'seed-k2',
    title: 'GTD 任务管理法',
    content: 'Getting Things Done（GTD）五步法：\n\n1. 捕获：将所有想法和任务记录下来\n2. 澄清：判断每个项目是否可执行\n3. 组织：将任务分类到不同清单\n4. 反思：定期回顾和更新\n5. 执行：根据情境选择合适的任务执行\n\n关键原则：大脑是用来思考的，不是用来记忆的。',
    categoryId: 'cat-outwork',
    createdAt: '2026-08-02T10:00:00.000Z',
    updatedAt: '2026-08-02T10:00:00.000Z',
  },
  {
    id: 'seed-k3',
    title: '橙橙日常照护要点',
    content: '橙橙在家的日常注意事项：\n\n- 定时喂食，每天2次，早晚各一次\n- 保证充足饮水，每天换新鲜水\n- 每天至少陪伴互动30分钟\n- 注意室内温度，保持在22-26度\n- 定期检查猫砂盆，保持清洁\n- 注意观察精神状态和食欲变化',
    categoryId: 'cat-orange',
    createdAt: '2026-08-03T09:00:00.000Z',
    updatedAt: '2026-08-03T09:00:00.000Z',
  },
  {
    id: 'seed-k4',
    title: '艾森豪威尔矩阵',
    content: '四象限任务分类法：\n\n- 重要且紧急：立即亲自做（危机、截止日期）\n- 重要不紧急：计划安排做（学习、锻炼、规划）\n- 紧急不重要：委托别人做（部分会议、电话）\n- 不紧急不重要：尽量减少（刷手机、无意义娱乐）\n\n高效人士把更多时间花在「重要不紧急」的第二象限。',
    categoryId: 'cat-outwork',
    createdAt: '2026-08-04T14:00:00.000Z',
    updatedAt: '2026-08-04T14:00:00.000Z',
  },
  {
    id: 'seed-k5',
    title: '独自在家效率指南',
    content: '居家独自工作时保持高效的方法：\n\n1. 固定工作区域，与休息区分开\n2. 穿着正式些，营造工作仪式感\n3. 制定每日计划，列出3件最重要的事\n4. 使用番茄钟保持专注\n5. 午休不超过30分钟\n6. 设定下班时间，工作生活分离\n7. 适当背景音乐，避免太安静',
    categoryId: 'cat-alone',
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

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      tasks: [],
      categories: defaultCategories,
      knowledge: seedKnowledge,
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
        set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
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
        const updatedTasks = state.tasks.map(t =>
          t.id === task.id
            ? { ...t, status: 'done' as TaskStatus, completedAt: new Date().toISOString() }
            : t
        );

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
          // 当前章节有 Boss
          const bossMaxHP = currentChapter.bossHP;
          const bossCurrentHP = newStoryProgress.bossCurrentHP[currentChapter.id] ?? bossMaxHP;
          const result = calculateBossDamage(bossMaxHP, bossCurrentHP, pointsEarned);

          newStoryProgress.bossCurrentHP = {
            ...newStoryProgress.bossCurrentHP,
            [currentChapter.id]: result.remainingHP,
          };

          // 生成故事日志
          newStoryLogs.push({
            id: generateId(),
            chapterId: currentChapter.id,
            text: `你完成了「${task.title}」，对${currentChapter.bossName}造成 ${pointsEarned} 点伤害！`,
            createdAt: new Date().toISOString(),
          });

          if (result.isDefeated) {
            bossDefeated = true;
            newStoryProgress.defeatedBosses = [...newStoryProgress.defeatedBosses, currentChapter.id];
            newStoryLogs.push({
              id: generateId(),
              chapterId: currentChapter.id,
              text: currentChapter.bossDefeatedText,
              createdAt: new Date().toISOString(),
            });

            // 解锁下一章
            const nextChapter = CHAPTERS.find(c => c.id === currentChapter.id + 1);
            if (nextChapter) {
              newStoryProgress.currentChapter = nextChapter.id;
              newStoryProgress.unlockedChapters = [...newStoryProgress.unlockedChapters, nextChapter.id];
              storyUnlocked = nextChapter.id;
              newStoryLogs.push({
                id: generateId(),
                chapterId: nextChapter.id,
                text: nextChapter.storyText,
                createdAt: new Date().toISOString(),
              });
            } else {
              storyUnlocked = 0; // 全部通关
              newStoryLogs.push({
                id: generateId(),
                chapterId: currentChapter.id,
                text: '恭喜你！你已通关全部章节，成为了真正的秩序守护者！',
                createdAt: new Date().toISOString(),
              });
            }
          }
        } else if (currentChapter) {
          // 当前章节没有 Boss（第1章），检查推进条件
          const ctx = {
            completedTaskCount: newCompletedCount,
            knowledgeCount: state.knowledge.length,
            currentStreak: newStreak,
          };
          if (checkChapterCondition(currentChapter.condition, currentChapter.conditionValue, ctx)) {
            // 条件满足，解锁下一章
            const nextChapter = CHAPTERS.find(c => c.id === currentChapter.id + 1);
            if (nextChapter) {
              newStoryProgress.currentChapter = nextChapter.id;
              newStoryProgress.unlockedChapters = [...newStoryProgress.unlockedChapters, nextChapter.id];
              storyUnlocked = nextChapter.id;
              newStoryLogs.push({
                id: generateId(),
                chapterId: nextChapter.id,
                text: nextChapter.storyText,
                createdAt: new Date().toISOString(),
              });
            }
          }

          // 第1章也生成日志
          newStoryLogs.push({
            id: generateId(),
            chapterId: currentChapter.id,
            text: `你完成了「${task.title}」，获得了 ${pointsEarned} 点经验值。`,
            createdAt: new Date().toISOString(),
          });
        }

        // 检查新解锁的章节是否有满足条件的
        // 对于第3章（累计10个任务）等条件，可能在非 Boss 章节时满足
        // 需要检查当前章节是否可以通过条件推进
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
                newStoryLogs.push({
                  id: generateId(),
                  chapterId: nextChapter.id,
                  text: nextChapter.storyText,
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
        }

        // 更新用户资料
        const newProfile: UserProfile = {
          ...profile,
          totalPoints: newTotalPoints,
          level: newLevel,
          completedTaskCount: newCompletedCount,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastCompletedDate: todayStr,
        };

        // 检查徽章
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
          // 从已完成切换到其他状态
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
          createdAt: now,
          updatedAt: now,
        };
        set(state => {
          const newKnowledge = [...state.knowledge, item];
          // 检查知识相关徽章
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

      // ===== 数据管理 =====
      exportJSON: () => {
        const state = get();
        const data = {
          tasks: state.tasks,
          categories: state.categories,
          knowledge: state.knowledge,
          userProfile: state.userProfile,
          userBadges: state.userBadges,
          dailyRecords: state.dailyRecords,
          storyProgress: state.storyProgress,
          storyLogs: state.storyLogs,
          exportTime: new Date().toISOString(),
          version: '1.0.0',
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
          userProfile: defaultUserProfile,
          userBadges: [],
          dailyRecords: [],
          storyProgress: defaultStoryProgress,
          storyLogs: [],
        });
      },
    }),
    {
      name: 'quest-planner-storage',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        // v1 -> v2: update categories and seed knowledge
        if (version < 2) {
          return {
            ...persistedState,
            categories: defaultCategories,
            knowledge: persistedState.knowledge?.length > 0
              ? persistedState.knowledge
              : seedKnowledge,
          };
        }
        return persistedState;
      },
    }
  )
);

// 辅助导出
export { BADGES, CHAPTERS };

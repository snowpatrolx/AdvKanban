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
import { advanceOccurrence, nextOccurrenceOnOrAfter, isToday, toLocalDateStr } from '../utils/taskHelpers';
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
  toggleTaskComplete: (id: string) => { pointsEarned: number; coinsEarned: number; newBadges: string[]; bossDefeated: boolean; storyUnlocked: number | null; wheelCoinsBonus: number; wheelMilestone: number | null };
  reorderTasks: (sourceId: string, targetId: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  archiveTask: (id: string) => void;
  unarchiveTask: (id: string) => void;
  archiveCompletedTasks: () => number;

  // 子任务操作
  addSubtask: (parentId: string, title: string, dueDate?: string | null) => string;
  updateSubtask: (id: string, data: Partial<Task>) => void;
  deleteSubtask: (id: string) => void;
  toggleSubtask: (id: string) => { bossDamage: number; coinsEarned: number; bossDefeated: boolean; storyUnlocked: number | null };

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

  // 每日任务每日重置（跨天后清除完成状态）
  resetDailyTasks: () => void;

  // 金币操作
  spendCoins: (amount: number) => boolean;
  // 金币商店
  shopBuyStreakShield: () => boolean;  // 购买连续天数护盾
  shopBuyCoinDouble: () => boolean;    // 购买下一次双倍金币
  shopBuyBossSmash: () => boolean;     // 购买 Boss 重击（直接造成伤害）
  shopBuyQuickComplete: () => boolean; // 购买"立即完成一个任务"

  // 互动
  adventureOption: (optionId: string) => { bossDamage: number; message: string; bossDefeated: boolean; cost: number; coinsGained: number; weakened: boolean; boosted: boolean };

  // 内部
  _processTaskCompletion: (task: Task) => { pointsEarned: number; coinsEarned: number; newBadges: string[]; bossDefeated: boolean; storyUnlocked: number | null; wheelCoinsBonus: number; wheelMilestone: number | null };
  _processSubtaskCompletion: (subtask: Task) => { bossDamage: number; coinsEarned: number; bossDefeated: boolean; storyUnlocked: number | null };
}

export const APP_VERSION = '1.19';

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
  coins: 0,
  streakShields: 0,
  pendingCoinDouble: false,
  pendingBossDamageBonus: 0,
  wheelRewardedCount: 0,
  wheelRewardDate: null,
};

const defaultStoryProgress: StoryProgress = {
  currentChapter: 1,
  unlockedChapters: [1],
  bossCurrentHP: {},
  defeatedBosses: [],
  bossWeaken: {},
  bossBoost: {},
  usedOptions: {},
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

// 对 Boss 造成伤害时应用增益：削弱（倍率）与强化（固定附加伤害），并消耗对应次数
function applyBossBuffs(
  storyProgress: StoryProgress,
  chapterId: number,
  baseDamage: number,
): { damage: number; bossWeaken: NonNullable<StoryProgress['bossWeaken']>; bossBoost: NonNullable<StoryProgress['bossBoost']> } {
  const bossWeaken = { ...(storyProgress.bossWeaken || {}) };
  const bossBoost = { ...(storyProgress.bossBoost || {}) };
  let damage = baseDamage;

  const weak = bossWeaken[chapterId];
  if (weak && weak.remaining > 0) {
    damage = Math.round(damage * weak.multiplier);
    const remaining = weak.remaining - 1;
    if (remaining > 0) bossWeaken[chapterId] = { multiplier: weak.multiplier, remaining };
    else delete bossWeaken[chapterId];
  }

  const boost = bossBoost[chapterId];
  if (boost && boost.remaining > 0) {
    damage += boost.bonus;
    const remaining = boost.remaining - 1;
    if (remaining > 0) bossBoost[chapterId] = { bonus: boost.bonus, remaining };
    else delete bossBoost[chapterId];
  }

  return { damage, bossWeaken, bossBoost };
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
        if (!task) return { pointsEarned: 0, coinsEarned: 0, newBadges: [], bossDefeated: false, storyUnlocked: null, wheelCoinsBonus: 0, wheelMilestone: null };

        // 已完成的任务（done 或今日已完成的 daily）取消完成
        if (task.status === 'done' || (task.status === 'daily' && task.completedAt && isToday(task.completedAt))) {
          set(state => ({
            tasks: state.tasks.map(t =>
              t.id === id ? { ...t, completedAt: null } : t
            ),
          }));
          return { pointsEarned: 0, coinsEarned: 0, newBadges: [], bossDefeated: false, storyUnlocked: null, wheelCoinsBonus: 0, wheelMilestone: null };
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
        const newStreakRaw = updateStreak(profile.lastCompletedDate, todayStr, profile.currentStreak);
        // 如果连续天数被重置为 1（说明跨天断签），且有连续天数护盾，则消耗一张护盾保持原天数
        let newStreak = newStreakRaw;
        let consumeShield = false;
        if (newStreakRaw === 1 && profile.currentStreak > 1 && state.userProfile.streakShields > 0) {
          newStreak = profile.currentStreak + 1; // 保持原来的连续天数并 +1
          consumeShield = true;
        }
        const newLongestStreak = Math.max(profile.longestStreak, newStreak);

        // 更新每日记录
        const newDailyRecords = updateDailyRecord(state.dailyRecords, todayStr, pointsEarned);

        // 更新任务状态：daily 任务保留 daily 状态，仅记录完成时间；其余设为 done
        const completedAt = new Date().toISOString();
        const newStatus: TaskStatus = task.status === 'daily' ? 'daily' : 'done';
        let updatedTasks = state.tasks.map(t =>
          t.id === task.id
            ? {
                ...t,
                status: newStatus,
                completedAt,
                // 每日任务每次完成累计重复计数
                repeatCount: task.status === 'daily' ? (t.repeatCount || 0) + 1 : t.repeatCount,
              }
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

        // 金币奖励：普通任务 10，高优先级任务 15；下一次双倍 buff 生效
        let coinsEarned = task.priority === 'high' ? 15 : 10;
        let consumeCoinDouble = false;
        if (state.userProfile.pendingCoinDouble) {
          coinsEarned *= 2;
          consumeCoinDouble = true;
        }

        // 更新用户资料
        const newCompletedCount = profile.completedTaskCount + 1;
        const newTotalPoints = profile.totalPoints + pointsEarned;
        const newLevel = getLevelByPoints(newTotalPoints).level;
        const newCoins = profile.coins + coinsEarned;

        let newProfileState: UserProfile = {
          ...profile,
          totalPoints: newTotalPoints,
          level: newLevel,
          completedTaskCount: newCompletedCount,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastCompletedDate: todayStr,
          coins: newCoins,
        };
        if (consumeCoinDouble) newProfileState.pendingCoinDouble = false;
        if (consumeShield) newProfileState.streakShields = Math.max(0, profile.streakShields - 1);

        // 轮盘节点奖励：每天 0 点重置，在 4/8/12 个任务完成时发放金币和护盾
        let wheelCoinsBonus = 0;
        let wheelShieldBonus = 0;
        let wheelCoinDoubleBonus = false;
        // 今天完成的任务数（包含刚刚完成的）
        const todayDoneCount =
          state.tasks.filter(t => t.status === 'done' && isToday(t.completedAt)).length +
          state.tasks.filter(t => t.status === 'daily' && t.completedAt && isToday(t.completedAt)).length + 1;
        const milestones = [4, 8, 12];
        const milestoneCoinRewards: Record<number, number> = { 4: 15, 8: 30, 12: 50 };
        // 如果不是今天的轮盘，重置已奖励计数
        const alreadyClaimed = (newProfileState.wheelRewardDate === todayStr)
          ? (newProfileState.wheelRewardedCount || 0)
          : 0;
        let newClaimed = alreadyClaimed;
        for (let i = alreadyClaimed; i < milestones.length; i++) {
          if (todayDoneCount >= milestones[i]) {
            wheelCoinsBonus += milestoneCoinRewards[milestones[i]] || 0;
            newClaimed = i + 1;
            if (milestones[i] === 8) wheelCoinDoubleBonus = true;
            if (milestones[i] === 12) wheelShieldBonus += 1;
          }
        }
        newProfileState.coins += wheelCoinsBonus;
        newProfileState.wheelRewardedCount = newClaimed;
        newProfileState.wheelRewardDate = todayStr;
        if (wheelCoinDoubleBonus) newProfileState.pendingCoinDouble = true;
        if (wheelShieldBonus > 0) newProfileState.streakShields = (newProfileState.streakShields || 0) + wheelShieldBonus;
        const highestMilestoneCrossed = newClaimed > alreadyClaimed ? milestones[newClaimed - 1] : null;
        let bossDefeated = false;
        let storyUnlocked: number | null = null;
        const newStoryProgress = { ...state.storyProgress };
        const newStoryLogs = [...state.storyLogs];

        const currentChapter = CHAPTERS.find(c => c.id === newStoryProgress.currentChapter);
        if (currentChapter && currentChapter.bossName) {
          const bossMaxHP = currentChapter.bossHP;
          const bossCurrentHP = newStoryProgress.bossCurrentHP[currentChapter.id] ?? bossMaxHP;
          // 完成任务造成的伤害同样享受削弱/强化效果
          const buffed = applyBossBuffs(newStoryProgress, currentChapter.id, pointsEarned);
          newStoryProgress.bossWeaken = buffed.bossWeaken;
          newStoryProgress.bossBoost = buffed.bossBoost;
          const result = calculateBossDamage(bossMaxHP, bossCurrentHP, buffed.damage);

          newStoryProgress.bossCurrentHP = {
            ...newStoryProgress.bossCurrentHP,
            [currentChapter.id]: result.remainingHP,
          };

          newStoryLogs.push(createLog(
            currentChapter.id,
            `你完成了「${task.title}」，对${currentChapter.bossName}造成 ${buffed.damage} 点伤害！`,
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
          userProfile: newProfileState,
          dailyRecords: newDailyRecords,
          storyProgress: newStoryProgress,
          storyLogs: newStoryLogs,
          userBadges: [...state.userBadges, ...newBadges],
        });

        return { pointsEarned, coinsEarned, newBadges, bossDefeated, storyUnlocked, wheelCoinsBonus, wheelMilestone: highestMilestoneCrossed };
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
      addSubtask: (parentId, title, dueDate) => {
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
          dueDate: dueDate !== undefined ? dueDate : (parent?.dueDate || null),
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
        if (!task || !task.parentId) return { bossDamage: 0, coinsEarned: 0, bossDefeated: false, storyUnlocked: null };

        if (task.status === 'done') {
          // 取消完成子任务
          set(state => ({
            tasks: state.tasks.map(t =>
              t.id === id ? { ...t, status: 'todo' as TaskStatus, completedAt: null } : t
            ),
          }));
          return { bossDamage: 0, coinsEarned: 0, bossDefeated: false, storyUnlocked: null };
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
              coinsEarned: result.coinsEarned + parentResult.coinsEarned,
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
        if (!parentTask) return { bossDamage: 0, coinsEarned: 0, bossDefeated: false, storyUnlocked: null };

        // 子任务伤害 = 父任务基础积分的一半
        const basePoints = parentTask.priority === 'high' ? 10 : 5;

        // 子任务金币奖励：每完成 1 个子任务获得 3 金币
        const coinsEarned = 3;

        let bossDefeated = false;
        let storyUnlocked: number | null = null;
        let bossDamage = basePoints;
        const newStoryProgress = { ...state.storyProgress };
        const newStoryLogs = [...state.storyLogs];

        const currentChapter = CHAPTERS.find(c => c.id === newStoryProgress.currentChapter);
        if (currentChapter && currentChapter.bossName) {
          const bossMaxHP = currentChapter.bossHP;
          const bossCurrentHP = newStoryProgress.bossCurrentHP[currentChapter.id] ?? bossMaxHP;
          // 子任务伤害同样享受削弱/强化效果
          const buffed = applyBossBuffs(newStoryProgress, currentChapter.id, basePoints);
          newStoryProgress.bossWeaken = buffed.bossWeaken;
          newStoryProgress.bossBoost = buffed.bossBoost;
          bossDamage = buffed.damage;
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

        // 更新金币
        const newProfile = { ...state.userProfile, coins: state.userProfile.coins + coinsEarned };

        set({
          storyProgress: newStoryProgress,
          storyLogs: newStoryLogs,
          userProfile: newProfile,
        });

        return { bossDamage, coinsEarned, bossDefeated, storyUnlocked };
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

      // 每日任务每日重置：昨日完成的 daily 任务自动回到未完成状态
      resetDailyTasks: () => {
        set(state => {
          let changed = false;
          const tasks = state.tasks.map(t => {
            if (t.status !== 'daily' || !t.completedAt) return t;
            if (toLocalDateStr(t.completedAt) === getTodayStr()) return t;
            changed = true;
            return { ...t, completedAt: null };
          });
          return changed ? { tasks } : {};
        });
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

      // 消耗金币（用于冒险章节选项）
      spendCoins: (amount) => {
        const state = get();
        if (state.userProfile.coins < amount) return false;
        set({ userProfile: { ...state.userProfile, coins: state.userProfile.coins - amount } });
        return true;
      },

      // 金币商店：连续天数护盾
      shopBuyStreakShield: () => {
        const state = get();
        const COST = 50;
        if (state.userProfile.coins < COST) return false;
        set({
          userProfile: {
            ...state.userProfile,
            coins: state.userProfile.coins - COST,
            streakShields: state.userProfile.streakShields + 1,
          },
        });
        return true;
      },

      // 金币商店：下一次任务双倍金币
      shopBuyCoinDouble: () => {
        const state = get();
        const COST = 30;
        if (state.userProfile.coins < COST) return false;
        if (state.userProfile.pendingCoinDouble) return false;
        set({
          userProfile: {
            ...state.userProfile,
            coins: state.userProfile.coins - COST,
            pendingCoinDouble: true,
          },
        });
        return true;
      },

      // 金币商店：Boss 重击（直接造成 30 伤害）
      shopBuyBossSmash: () => {
        const state = get();
        const COST = 100;
        if (state.userProfile.coins < COST) return false;
        const currentChapter = CHAPTERS.find(c => c.id === state.storyProgress.currentChapter);
        if (!currentChapter || !currentChapter.bossName) return false;
        if (state.storyProgress.defeatedBosses.includes(currentChapter.id)) return false;

        const BOSS_DAMAGE = 30;
        const bossMaxHP = currentChapter.bossHP;
        const currentHP = state.storyProgress.bossCurrentHP[currentChapter.id] ?? bossMaxHP;
        const buffed = applyBossBuffs(state.storyProgress, currentChapter.id, BOSS_DAMAGE);
        const result = calculateBossDamage(bossMaxHP, currentHP, buffed.damage);

        const newStoryProgress = { ...state.storyProgress };
        newStoryProgress.bossWeaken = buffed.bossWeaken;
        newStoryProgress.bossBoost = buffed.bossBoost;
        newStoryProgress.bossCurrentHP = {
          ...newStoryProgress.bossCurrentHP,
          [currentChapter.id]: result.remainingHP,
        };

        const newStoryLogs = [...state.storyLogs];
        newStoryLogs.push(createLog(
          currentChapter.id,
          `你购买了 Boss 重击，对${currentChapter.bossName}造成 ${buffed.damage} 点伤害！`,
          'damage',
        ));

        let bossDefeated = false;
        let storyUnlocked: number | null = null;
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

        set({
          userProfile: { ...state.userProfile, coins: state.userProfile.coins - COST },
          storyProgress: newStoryProgress,
          storyLogs: newStoryLogs,
        });
        return true;
      },

      // 金币商店：立即完成一个任务（完成优先级最高的 todo/doing 非每日主任务）
      shopBuyQuickComplete: () => {
        const state = get();
        const COST = 200;
        if (state.userProfile.coins < COST) return false;
        // 找一个 todo/doing 非 daily/shopping 的主任务
        const candidates = state.tasks.filter((t: Task) =>
          !t.parentId && !t.archived && (t.status === 'todo' || t.status === 'doing')
        );
        if (candidates.length === 0) return false;
        const task = [...candidates].sort((a, b) => {
          const pa = a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2;
          const pb = b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2;
          if (pa !== pb) return pa - pb;
          return a.order - b.order;
        })[0];
        set({ userProfile: { ...state.userProfile, coins: state.userProfile.coins - COST } });
        get()._processTaskCompletion(task);
        return true;
      },

      // 冒险章节互动：消耗金币选择选项，产生伤害 / 削弱 / 金币效果
      adventureOption: (optionId) => {
        const state = get();
        const currentChapter = CHAPTERS.find(c => c.id === state.storyProgress.currentChapter);
        if (!currentChapter || !currentChapter.bossName) {
          return { bossDamage: 0, message: '当前章节没有 Boss', bossDefeated: false, cost: 0, coinsGained: 0, weakened: false, boosted: false };
        }
        if (state.storyProgress.defeatedBosses.includes(currentChapter.id)) {
          return { bossDamage: 0, message: `${currentChapter.bossName} 已被击败`, bossDefeated: false, cost: 0, coinsGained: 0, weakened: false, boosted: false };
        }

        const option = currentChapter.options?.find(o => o.id === optionId);
        if (!option) {
          return { bossDamage: 0, message: '未知选项', bossDefeated: false, cost: 0, coinsGained: 0, weakened: false, boosted: false };
        }

        // 检查金币是否足够
        if (state.userProfile.coins < option.cost) {
          return { bossDamage: 0, message: `金币不足，需要 ${option.cost} 金币`, bossDefeated: false, cost: option.cost, coinsGained: 0, weakened: false, boosted: false };
        }

        const effect = option.effect || 'damage';
        const chapterId = currentChapter.id;
        // 金币搜刮类选项每章只能使用一次，避免无限刷金币
        const isOneTime = effect === 'loot';
        if (isOneTime && (state.storyProgress.usedOptions?.[chapterId] || []).includes(option.id)) {
          return { bossDamage: 0, message: `「${option.label}」已经使用过了`, bossDefeated: false, cost: 0, coinsGained: 0, weakened: false, boosted: false };
        }
        const bossMaxHP = currentChapter.bossHP;
        const currentHP = state.storyProgress.bossCurrentHP[chapterId] ?? bossMaxHP;
        let bossWeaken = { ...(state.storyProgress.bossWeaken || {}) };
        let bossBoost = { ...(state.storyProgress.bossBoost || {}) };

        let bossDamage = 0;
        let coinsGained = 0;
        let weakened = false;
        let boosted = false;
        let newHP = currentHP;
        let message = '';

        if (effect === 'loot') {
          // 掠夺：不造成伤害，反而获得金币
          coinsGained = option.lootCoins || 0;
          message = `你选择了「${option.label}」，搜刮到 ${coinsGained} 金币，${currentChapter.bossName} 毫发无损。`;
        } else if (effect === 'weaken') {
          // 削弱：施加易伤状态，后续出手伤害提升
          const multiplier = option.weakenMultiplier ?? 1.5;
          const turns = option.weakenTurns ?? 3;
          bossWeaken[chapterId] = { multiplier, remaining: turns };
          weakened = true;
          message = `你选择了「${option.label}」，${currentChapter.bossName} 的防御被削弱，接下来 ${turns} 次出手伤害 ×${multiplier}！`;
        } else if (effect === 'boost') {
          // 强化：后续出手附加固定伤害
          const bonus = option.boostBonus ?? 20;
          const turns = option.boostTurns ?? 3;
          bossBoost[chapterId] = { bonus, remaining: turns };
          boosted = true;
          message = `你选择了「${option.label}」，接下来 ${turns} 次出手附加 ${bonus} 点伤害！`;
        } else {
          // damage / drain：造成伤害，并享受削弱与强化效果
          const buffed = applyBossBuffs(
            { ...state.storyProgress, bossWeaken, bossBoost },
            chapterId,
            option.damage,
          );
          bossDamage = buffed.damage;
          bossWeaken = buffed.bossWeaken;
          bossBoost = buffed.bossBoost;
          newHP = Math.max(0, currentHP - bossDamage);

          if (effect === 'drain') {
            coinsGained = option.drainCoins || 0;
            message = `你选择了「${option.label}」，对 ${currentChapter.bossName} 造成 ${bossDamage} 点伤害，并掠取 ${coinsGained} 金币！`;
          } else {
            message = `你选择了「${option.label}」，消耗 ${option.cost} 金币，对 ${currentChapter.bossName} 造成 ${bossDamage} 点伤害！`;
          }
        }

        const bossDefeated = newHP === 0 && currentHP > 0;
        const newCoins = state.userProfile.coins - option.cost + coinsGained;

        set(s => {
          const newStoryProgress = { ...s.storyProgress };
          newStoryProgress.bossCurrentHP = {
            ...newStoryProgress.bossCurrentHP,
            [chapterId]: newHP,
          };
          newStoryProgress.bossWeaken = bossWeaken;
          newStoryProgress.bossBoost = bossBoost;
          if (isOneTime) {
            newStoryProgress.usedOptions = {
              ...(newStoryProgress.usedOptions || {}),
              [chapterId]: [...(newStoryProgress.usedOptions?.[chapterId] || []), option.id],
            };
          }

          const newStoryLogs = [...s.storyLogs];
          newStoryLogs.push({
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            chapterId,
            type: (effect === 'damage' || effect === 'drain' ? 'damage' : 'story') as LogType,
            text: message,
            createdAt: new Date().toISOString(),
          });

          if (bossDefeated && !newStoryProgress.defeatedBosses.includes(chapterId)) {
            newStoryProgress.defeatedBosses = [...newStoryProgress.defeatedBosses, chapterId];
            newStoryLogs.push({
              id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}-defeat`,
              chapterId,
              type: 'story' as LogType,
              text: `你成功击败了 ${currentChapter.bossName}！${currentChapter.bossDefeatedText}`,
              createdAt: new Date().toISOString(),
            });

            const nextChapter = CHAPTERS.find(c => c.id === chapterId + 1);
            if (nextChapter && !newStoryProgress.unlockedChapters.includes(nextChapter.id)) {
              newStoryProgress.unlockedChapters = [...newStoryProgress.unlockedChapters, nextChapter.id];
              newStoryProgress.currentChapter = nextChapter.id;
            }
          }

          return {
            storyProgress: newStoryProgress,
            storyLogs: newStoryLogs,
            userProfile: { ...s.userProfile, coins: newCoins },
          };
        });

        return { bossDamage, message, bossDefeated, cost: option.cost, coinsGained, weakened, boosted };
      },
    }),
    {
      name: 'quest-planner-storage',
      version: 11,
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

        // v6 -> v7: 新增金币字段（冒险章节互动选项消耗）
        if (version < 7) {
          if (state.userProfile && typeof state.userProfile.coins !== 'number') {
            state.userProfile = { ...state.userProfile, coins: 0 };
          } else if (!state.userProfile) {
            state.userProfile = { ...defaultUserProfile };
          }
        }

        // v8 -> v9: 移除任务标签数据，新增 Boss 削弱状态字段
        if (version < 9) {
          delete state.tags;
          if (state.tasks) {
            state.tasks = state.tasks.map((t: any) => {
              const { tagIds, ...rest } = t;
              return rest;
            });
          }
          if (state.storyProgress && !state.storyProgress.bossWeaken) {
            state.storyProgress = { ...state.storyProgress, bossWeaken: {} };
          }
        }

        // v9 -> v10: 新增 Boss 强化状态与一次性选项记录字段
        if (version < 10) {
          const progress = state.storyProgress;
          if (progress) {
            state.storyProgress = {
              ...progress,
              bossBoost: progress.bossBoost || {},
              usedOptions: progress.usedOptions || {},
            };
          }
        }

        // v10 -> v11: 新增金币商店相关 userProfile 字段
        if (version < 11) {
          if (state.userProfile) {
            state.userProfile = {
              ...state.userProfile,
              streakShields: 0,
              pendingCoinDouble: false,
              pendingBossDamageBonus: 0,
            };
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

          // 同步重复任务日期 + 重置每日任务
          const todayStr = getTodayStr();
          state.tasks = state.tasks.map(t => {
            // daily 任务：跨天后清除完成时间，实现每日重复
            if (t.status === 'daily' && t.completedAt && toLocalDateStr(t.completedAt) !== todayStr) {
              return { ...t, completedAt: null };
            }
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

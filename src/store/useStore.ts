import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Task, Category, Knowledge, Note, UserProfile, StoryProgress, StoryLog, DailyRecord,
  TaskStatus, TaskPriority, RepeatType, LogType, ShopItem, FarmPlot, FarmBuildings,
} from '../types';
import { generateId, getTodayStr } from '../utils/id';
import {
  calculateTaskPoints, getLevelByPoints, updateStreak,
  checkChapterCondition, calculateBossDamage, updateDailyRecord,
} from '../utils/gamification';
import { getDailyWheelRewards } from '../utils/wheelRewards';
import { advanceOccurrence, nextOccurrenceOnOrAfter, isToday, toLocalDateStr } from '../utils/taskHelpers';
import { CHAPTERS } from '../data/chapters';

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
  toggleTaskComplete: (id: string) => { pointsEarned: number; coinsEarned: number; newBadges: string[]; bossDefeated: boolean; storyUnlocked: number | null; wheelCoinsBonus: number; wheelMilestone: number | null; shoppingCost?: number; blockedByCoins?: boolean };
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

  // 金币商店（可编辑）
  shopItems: ShopItem[];
  buyShopItem: (itemId: string) => boolean;
  buyShoppingTask: (taskId: string) => boolean;
  updateShopItem: (id: string, data: Partial<ShopItem>) => void;
  addShopItem: (data: Omit<ShopItem, 'id'>) => string;
  deleteShopItem: (id: string) => void;
  resetShopItems: () => void;

  // 家园农田
  farm: FarmPlot[];
  farmBuildings: FarmBuildings;
  plantCrop: (plotId: number, cropKey: string) => boolean;
  harvestCrop: (plotId: number) => number;
  upgradeBuilding: (key: keyof FarmBuildings) => boolean;

  // 互动
  adventureOption: (optionId: string) => { message: string; cost: number; coinsGained: number; pointsGained: number; shieldsGained: number; doubleTurns: number; oneTimeUsed: boolean };
  unlockSideQuest: (sideQuestId: string) => { message: string; rewardCoins: number; rewardPoints: number };
  completeSideQuestOption: (sideQuestId: string, optionId: string) => { message: string; cost: number; coinsGained: number; pointsGained: number; shieldsGained: number; doubleTurns: number; sideQuestCompleted: boolean };

  // 内部
  _processTaskCompletion: (task: Task) => { pointsEarned: number; coinsEarned: number; newBadges: string[]; bossDefeated: boolean; storyUnlocked: number | null; wheelCoinsBonus: number; wheelMilestone: number | null; shoppingCost?: number };
  _processSubtaskCompletion: (subtask: Task) => { bossDamage: number; coinsEarned: number; bossDefeated: boolean; storyUnlocked: number | null };
}

export const APP_VERSION = '1.23';

// 家园农田作物配置
export const FARM_CROPS: Record<string, { name: string; emoji: string; cost: number; required: number; reward: number }> = {
  wheat: { name: '小麦', emoji: '🌾', cost: 20, required: 3, reward: 32 },
  carrot: { name: '胡萝卜', emoji: '🥕', cost: 35, required: 5, reward: 60 },
  corn: { name: '玉米', emoji: '🌽', cost: 45, required: 6, reward: 82 },
  starfruit: { name: '星光果', emoji: '✨', cost: 60, required: 8, reward: 110 },
  pumpkin: { name: '南瓜', emoji: '🎃', cost: 85, required: 10, reward: 165 },
};

// 家园建筑配置
export const FARM_BUILDINGS: Record<keyof FarmBuildings, { name: string; emoji: string; desc: string; max: number; baseCost: number }> = {
  barn: { name: '谷仓', emoji: '🏚️', desc: '每级收获金币 +15%', max: 3, baseCost: 60 },
  windmill: { name: '风车', emoji: '🌀', desc: '每级成熟所需任务 -1', max: 3, baseCost: 80 },
  workshop: { name: '工坊', emoji: '🔨', desc: '每级种子费用 -10%', max: 3, baseCost: 100 },
};

const defaultFarmBuildings: FarmBuildings = { barn: 0, windmill: 0, workshop: 0 };

const defaultShopItems: ShopItem[] = [
  { id: 'shop-shield', name: '连续天数护盾', desc: '下次断签自动保持天数', cost: 50, icon: '🛡', effect: 'streakShield', enabled: true },
  { id: 'shop-double', name: '双倍金币券', desc: '下一次完成任务金币翻倍', cost: 30, icon: '✦', effect: 'coinDouble', enabled: true },
  { id: 'shop-quick', name: '任务加速', desc: '立即完成一个最高优先级任务', cost: 200, icon: '⚡', effect: 'quickComplete', enabled: true },
];

const defaultFarm: FarmPlot[] = [1, 2, 3, 4, 5, 6].map(id => ({
  id, crop: null, progress: 0, required: 0, cost: 0, reward: 0,
}));

/** 购物任务在金币商城中的价格（按优先级） */
export function getShoppingTaskPrice(task: Task): number {
  if (task.priority === 'high') return 80;
  if (task.priority === 'medium') return 50;
  if (task.priority === 'low') return 30;
  return 40;
}

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
  pendingCoinDoubleTurns: 0,
  wheelRewardedCount: 0,
  wheelRewardDate: null,
};

const defaultStoryProgress: StoryProgress = {
  currentChapter: 1,
  unlockedChapters: [1],
  bossCurrentHP: {},
  defeatedBosses: [],
  usedOptions: {},
  unlockedSideQuests: [],
  completedSideQuests: [],
  usedSideQuestOptions: {},
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
      shopItems: defaultShopItems,
      farm: defaultFarm,
      farmBuildings: defaultFarmBuildings,
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

        // 购物任务：完成时需要消耗金币，金币不足则阻止完成
        if (task.status === 'shopping') {
          const price = getShoppingTaskPrice(task);
          if (get().userProfile.coins < price) {
            return {
              pointsEarned: 0, coinsEarned: 0, newBadges: [], bossDefeated: false,
              storyUnlocked: null, wheelCoinsBonus: 0, wheelMilestone: null,
              shoppingCost: price, blockedByCoins: true,
            };
          }
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

        // 金币奖励：普通任务 10，高优先级任务 15；pendingCoinDoubleTurns > 0 时翻倍并 -1
        let coinsEarned = task.priority === 'high' ? 15 : 10;
        let consumeDouble = false;
        if (state.userProfile.pendingCoinDoubleTurns > 0) {
          coinsEarned *= 2;
          consumeDouble = true;
        }
        // 购物任务完成时需要消耗金币
        const shoppingCost = task.status === 'shopping' ? getShoppingTaskPrice(task) : 0;

        // 更新用户资料
        const newCompletedCount = profile.completedTaskCount + 1;
        const newTotalPoints = profile.totalPoints + pointsEarned;
        const newLevel = getLevelByPoints(newTotalPoints).level;
        const newCoins = Math.max(0, profile.coins + coinsEarned - shoppingCost);

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
        if (consumeDouble) newProfileState.pendingCoinDoubleTurns = Math.max(0, state.userProfile.pendingCoinDoubleTurns - 1);
        if (consumeShield) newProfileState.streakShields = Math.max(0, profile.streakShields - 1);

        // 轮盘节点奖励：每天随机刷新，在 4/8/12 个任务完成时发放
        let wheelCoinsBonus = 0;
        let wheelPointsBonus = 0;
        let wheelFarmBoost = 0;
        // 今天完成的任务数（包含刚刚完成的）
        const todayDoneCount =
          state.tasks.filter(t => t.status === 'done' && isToday(t.completedAt)).length +
          state.tasks.filter(t => t.status === 'daily' && t.completedAt && isToday(t.completedAt)).length + 1;
        const milestones = [4, 8, 12];
        const dailyWheelRewards = getDailyWheelRewards(todayStr);
        // 如果不是今天的轮盘，重置已奖励计数
        const alreadyClaimed = (newProfileState.wheelRewardDate === todayStr)
          ? (newProfileState.wheelRewardedCount || 0)
          : 0;
        let newClaimed = alreadyClaimed;
        for (let i = alreadyClaimed; i < milestones.length; i++) {
          if (todayDoneCount >= milestones[i]) {
            newClaimed = i + 1;
            const reward = dailyWheelRewards.find(r => r.at === milestones[i]);
            if (!reward) continue;
            switch (reward.kind) {
              case 'coins':
                wheelCoinsBonus += reward.amount;
                break;
              case 'shield':
                newProfileState.streakShields = (newProfileState.streakShields || 0) + reward.amount;
                break;
              case 'coinDouble':
                newProfileState.pendingCoinDoubleTurns = Math.max(newProfileState.pendingCoinDoubleTurns || 0, 1);
                break;
              case 'bossBonus':
                // 伤害相关选项已取消，此奖励改为额外连续天数护盾
                newProfileState.streakShields = (newProfileState.streakShields || 0) + reward.amount;
                break;
              case 'points':
                wheelPointsBonus += reward.amount;
                break;
              case 'farmBoost':
                wheelFarmBoost += reward.amount;
                break;
            }
          }
        }
        newProfileState.coins += wheelCoinsBonus;
        if (wheelPointsBonus > 0) {
          newProfileState.totalPoints += wheelPointsBonus;
          newProfileState.level = getLevelByPoints(newProfileState.totalPoints).level;
        }
        newProfileState.wheelRewardedCount = newClaimed;
        newProfileState.wheelRewardDate = todayStr;
        const highestMilestoneCrossed = newClaimed > alreadyClaimed ? milestones[newClaimed - 1] : null;
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

        // 徽章功能已取消，不再发放
        const newBadges: string[] = [];

        // 完成任务推进家园农田里的作物成长（轮盘作物成长奖励可额外推进）
        const newFarm = state.farm.map(p => {
          if (!p.crop) return p;
          let progress = p.progress;
          if (progress < p.required) progress += 1;
          if (wheelFarmBoost > 0 && progress < p.required) {
            progress = Math.min(p.required, progress + wheelFarmBoost);
          }
          return progress === p.progress ? p : { ...p, progress };
        });

        set({
          tasks: updatedTasks,
          userProfile: newProfileState,
          dailyRecords: newDailyRecords,
          storyProgress: newStoryProgress,
          storyLogs: newStoryLogs,
          farm: newFarm,
        });

        return { pointsEarned, coinsEarned, newBadges, bossDefeated, storyUnlocked, wheelCoinsBonus, wheelMilestone: highestMilestoneCrossed, shoppingCost };
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
          const result = calculateBossDamage(bossMaxHP, bossCurrentHP, basePoints);
          bossDamage = basePoints;
          newStoryProgress.bossCurrentHP = {
            ...newStoryProgress.bossCurrentHP,
            [currentChapter.id]: result.remainingHP,
          };

          newStoryLogs.push(createLog(
            currentChapter.id,
            `你完成了子任务「${subtask.title}」，对${currentChapter.bossName}造成 ${basePoints} 点伤害！`,
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
          return {
            knowledge: newKnowledge,
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

      // 每日任务每日重置：昨日完成的 daily 任务自动回到未完成状态，并把日期滚动到今天
      resetDailyTasks: () => {
        set(state => {
          const todayStr = getTodayStr();
          let changed = false;
          const tasks = state.tasks.map(t => {
            if (t.status !== 'daily' || !t.completedAt) return t;
            if (toLocalDateStr(t.completedAt) === todayStr) return t;
            changed = true;
            return { ...t, completedAt: null, dueDate: t.dueDate ? todayStr : t.dueDate };
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
          shopItems: state.shopItems,
          farm: state.farm,
          farmBuildings: state.farmBuildings,
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
            shopItems: data.shopItems || defaultShopItems,
            farm: data.farm || defaultFarm,
            farmBuildings: data.farmBuildings || defaultFarmBuildings,
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
          shopItems: defaultShopItems,
          farm: defaultFarm,
          farmBuildings: defaultFarmBuildings,
        });
      },

      // 消耗金币（用于冒险章节选项）
      spendCoins: (amount) => {
        const state = get();
        if (state.userProfile.coins < amount) return false;
        set({ userProfile: { ...state.userProfile, coins: state.userProfile.coins - amount } });
        return true;
      },

      // 金币商店：购买指定商品（价格与名称均可在商店中编辑）
      buyShopItem: (itemId) => {
        const state = get();
        const item = state.shopItems.find(i => i.id === itemId);
        if (!item || !item.enabled) return false;
        const cost = Math.max(0, item.cost);
        if (state.userProfile.coins < cost) return false;

        if (item.effect === 'streakShield') {
          set({
            userProfile: {
              ...state.userProfile,
              coins: state.userProfile.coins - cost,
              streakShields: state.userProfile.streakShields + 1,
            },
          });
          return true;
        }

        if (item.effect === 'coinDouble') {
          if (state.userProfile.pendingCoinDoubleTurns > 0) return false;
          set({
            userProfile: {
              ...state.userProfile,
              coins: state.userProfile.coins - cost,
              pendingCoinDoubleTurns: 1,
            },
          });
          return true;
        }

        if (item.effect === 'quickComplete') {
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
          set({ userProfile: { ...state.userProfile, coins: state.userProfile.coins - cost } });
          get()._processTaskCompletion(task);
          return true;
        }

        return false;
      },

      // 金币商城购买购物任务：扣除金币并完成任务
      buyShoppingTask: (taskId) => {
        const state = get();
        const task = state.tasks.find(t => t.id === taskId && t.status === 'shopping' && !t.archived);
        if (!task) return false;
        // 金币是否足够由 toggleTaskComplete 统一校验并扣除
        if (state.userProfile.coins < getShoppingTaskPrice(task)) return false;
        const result = get().toggleTaskComplete(taskId);
        return !result.blockedByCoins;
      },

      updateShopItem: (id, data) => {
        set(state => ({
          shopItems: state.shopItems.map(i => i.id === id ? { ...i, ...data } : i),
        }));
      },

      addShopItem: (data) => {
        const id = generateId();
        set(state => ({ shopItems: [...state.shopItems, { ...data, id }] }));
        return id;
      },

      deleteShopItem: (id) => {
        set(state => ({ shopItems: state.shopItems.filter(i => i.id !== id) }));
      },

      resetShopItems: () => {
        set({ shopItems: defaultShopItems });
      },

      // 家园农田：播种
      plantCrop: (plotId, cropKey) => {
        const state = get();
        const crop = FARM_CROPS[cropKey];
        if (!crop) return false;
        const plot = state.farm.find(p => p.id === plotId);
        if (!plot || plot.crop) return false;
        // 建筑加成：工坊降低种子费用，风车减少成熟所需任务，谷仓提高收获金币
        const actualCost = Math.max(1, Math.round(crop.cost * (1 - 0.1 * state.farmBuildings.workshop)));
        if (state.userProfile.coins < actualCost) return false;
        const required = Math.max(1, crop.required - state.farmBuildings.windmill);
        const reward = Math.round(crop.reward * (1 + 0.15 * state.farmBuildings.barn));
        set({
          userProfile: { ...state.userProfile, coins: state.userProfile.coins - actualCost },
          farm: state.farm.map(p => p.id === plotId
            ? { ...p, crop: cropKey, progress: 0, required, cost: actualCost, reward }
            : p),
        });
        return true;
      },

      // 家园农田：收获成熟作物，返回获得的金币
      harvestCrop: (plotId) => {
        const state = get();
        const plot = state.farm.find(p => p.id === plotId);
        if (!plot || !plot.crop || plot.progress < plot.required) return 0;
        const reward = plot.reward;
        set({
          userProfile: { ...state.userProfile, coins: state.userProfile.coins + reward },
          farm: state.farm.map(p => p.id === plotId
            ? { id: p.id, crop: null, progress: 0, required: 0, cost: 0, reward: 0 }
            : p),
        });
        return reward;
      },

      // 家园建设：升级建筑（谷仓 / 风车 / 工坊）
      upgradeBuilding: (key) => {
        const state = get();
        const config = FARM_BUILDINGS[key];
        const level = state.farmBuildings[key];
        if (level >= config.max) return false;
        const cost = config.baseCost * (level + 1);
        if (state.userProfile.coins < cost) return false;
        set({
          userProfile: { ...state.userProfile, coins: state.userProfile.coins - cost },
          farmBuildings: { ...state.farmBuildings, [key]: level + 1 },
        });
        return true;
      },

      // 冒险章节互动（已取消伤害相关选项，全部为 loot / wisdom / favor / fortune）
      adventureOption: (optionId) => {
        const state = get();
        const currentChapter = CHAPTERS.find(c => c.id === state.storyProgress.currentChapter);
        if (!currentChapter) {
          return { message: '未知章节', cost: 0, coinsGained: 0, pointsGained: 0, shieldsGained: 0, doubleTurns: 0, oneTimeUsed: false };
        }

        const option = currentChapter.options?.find(o => o.id === optionId);
        if (!option) {
          return { message: '未知选项', cost: 0, coinsGained: 0, pointsGained: 0, shieldsGained: 0, doubleTurns: 0, oneTimeUsed: false };
        }

        const isOneTime = option.oneTime ?? (option.effect === 'loot');
        const chapterId = currentChapter.id;
        if (isOneTime && (state.storyProgress.usedOptions?.[chapterId] || []).includes(option.id)) {
          return { message: `「${option.label}」已经使用过了`, cost: 0, coinsGained: 0, pointsGained: 0, shieldsGained: 0, doubleTurns: 0, oneTimeUsed: true };
        }

        if (state.userProfile.coins < option.cost) {
          return { message: `金币不足，需要 ${option.cost} 金币`, cost: option.cost, coinsGained: 0, pointsGained: 0, shieldsGained: 0, doubleTurns: 0, oneTimeUsed: false };
        }

        let coinsGained = 0;
        let pointsGained = 0;
        let shieldsGained = 0;
        let doubleTurns = 0;
        let message = '';

        switch (option.effect) {
          case 'loot':
            coinsGained = option.lootCoins || 0;
            message = `你选择了「${option.label}」，获得 ${coinsGained} 金币。`;
            break;
          case 'wisdom':
            pointsGained = option.wisdomPoints || 0;
            message = `你选择了「${option.label}」，获得 ${pointsGained} 经验值。`;
            break;
          case 'favor':
            shieldsGained = option.favorShields || 1;
            message = `你选择了「${option.label}」，获得 ${shieldsGained} 张连续天数护盾。`;
            break;
          case 'fortune':
            doubleTurns = option.fortuneTurns || 1;
            message = `你选择了「${option.label}」，接下来 ${doubleTurns} 次任务金币翻倍！`;
            break;
        }

        const newCoins = state.userProfile.coins - option.cost + coinsGained;
        const newPoints = state.userProfile.totalPoints + pointsGained;
        const newLevel = getLevelByPoints(newPoints).level;

        set(s => {
          const newStoryProgress = { ...s.storyProgress };
          if (isOneTime) {
            newStoryProgress.usedOptions = {
              ...(newStoryProgress.usedOptions || {}),
              [chapterId]: [...(newStoryProgress.usedOptions?.[chapterId] || []), option.id],
            };
          }

          const newStoryLogs = [...s.storyLogs, createLog(chapterId, message, 'story')];

          return {
            storyProgress: newStoryProgress,
            storyLogs: newStoryLogs,
            userProfile: {
              ...s.userProfile,
              coins: newCoins,
              totalPoints: newPoints,
              level: newLevel,
              streakShields: s.userProfile.streakShields + shieldsGained,
              pendingCoinDoubleTurns: s.userProfile.pendingCoinDoubleTurns + doubleTurns,
            },
          };
        });

        return { message, cost: option.cost, coinsGained, pointsGained, shieldsGained, doubleTurns, oneTimeUsed: false };
      },

      // 解锁章节支线（首次解锁即获得奖励）
      unlockSideQuest: (sideQuestId) => {
        const state = get();
        const sideQuest = CHAPTERS
          .flatMap(c => c.sideQuests || [])
          .find(q => q.id === sideQuestId);
        if (!sideQuest) {
          return { message: '未知支线', rewardCoins: 0, rewardPoints: 0 };
        }
        if (state.storyProgress.unlockedSideQuests.includes(sideQuestId)) {
          return { message: '该支线已解锁', rewardCoins: 0, rewardPoints: 0 };
        }
        const newCoins = state.userProfile.coins + sideQuest.rewardCoins;
        const newPoints = state.userProfile.totalPoints + sideQuest.rewardPoints;
        const newLevel = getLevelByPoints(newPoints).level;

        const chapterId = sideQuest.chapterId;
        set(s => ({
          storyProgress: {
            ...s.storyProgress,
            unlockedSideQuests: [...s.storyProgress.unlockedSideQuests, sideQuestId],
          },
          storyLogs: [
            ...s.storyLogs,
            createLog(chapterId, sideQuest.storyText, 'story'),
          ],
          userProfile: {
            ...s.userProfile,
            coins: newCoins,
            totalPoints: newPoints,
            level: newLevel,
          },
        }));

        return { message: `解锁「${sideQuest.title}」成功！`, rewardCoins: sideQuest.rewardCoins, rewardPoints: sideQuest.rewardPoints };
      },

      // 选择支线中的一个选项
      completeSideQuestOption: (sideQuestId, optionId) => {
        const state = get();
        const sideQuest = CHAPTERS
          .flatMap(c => c.sideQuests || [])
          .find(q => q.id === sideQuestId);
        if (!sideQuest) {
          return { message: '未知支线', cost: 0, coinsGained: 0, pointsGained: 0, shieldsGained: 0, doubleTurns: 0, sideQuestCompleted: false };
        }
        if (!state.storyProgress.unlockedSideQuests.includes(sideQuestId)) {
          return { message: '请先解锁该支线', cost: 0, coinsGained: 0, pointsGained: 0, shieldsGained: 0, doubleTurns: 0, sideQuestCompleted: false };
        }
        if (state.storyProgress.completedSideQuests.includes(sideQuestId)) {
          return { message: '该支线已完成', cost: 0, coinsGained: 0, pointsGained: 0, shieldsGained: 0, doubleTurns: 0, sideQuestCompleted: false };
        }

        const option = sideQuest.options.find(o => o.id === optionId);
        if (!option) {
          return { message: '未知选项', cost: 0, coinsGained: 0, pointsGained: 0, shieldsGained: 0, doubleTurns: 0, sideQuestCompleted: false };
        }

        if (state.userProfile.coins < option.cost) {
          return { message: `金币不足，需要 ${option.cost} 金币`, cost: option.cost, coinsGained: 0, pointsGained: 0, shieldsGained: 0, doubleTurns: 0, sideQuestCompleted: false };
        }

        // 支线：一旦选择任意选项即视为完成（避免无限刷）
        const coinsGained = option.lootCoins || 0;
        const pointsGained = option.wisdomPoints || 0;
        const shieldsGained = option.favorShields || 0;
        const doubleTurns = option.fortuneTurns || 0;

        const newCoins = state.userProfile.coins - option.cost + coinsGained;
        const newPoints = state.userProfile.totalPoints + pointsGained;
        const newLevel = getLevelByPoints(newPoints).level;

        const chapterId = sideQuest.chapterId;
        const message = `你在「${sideQuest.title}」中选择了「${option.label}」。${option.description}`;

        set(s => ({
          storyProgress: {
            ...s.storyProgress,
            completedSideQuests: [...s.storyProgress.completedSideQuests, sideQuestId],
            usedSideQuestOptions: {
              ...s.storyProgress.usedSideQuestOptions,
              [sideQuestId]: [...(s.storyProgress.usedSideQuestOptions[sideQuestId] || []), option.id],
            },
          },
          storyLogs: [...s.storyLogs, createLog(chapterId, message, 'story')],
          userProfile: {
            ...s.userProfile,
            coins: newCoins,
            totalPoints: newPoints,
            level: newLevel,
            streakShields: s.userProfile.streakShields + shieldsGained,
            pendingCoinDoubleTurns: s.userProfile.pendingCoinDoubleTurns + doubleTurns,
          },
        }));

        return { message, cost: option.cost, coinsGained, pointsGained, shieldsGained, doubleTurns, sideQuestCompleted: true };
      },
    }),
    {
      name: 'quest-planner-storage',
      version: 14,
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

        // v11 -> v12: 新增可编辑金币商店、家园农田，并补齐轮盘奖励字段
        if (version < 12) {
          if (!state.shopItems) state.shopItems = defaultShopItems;
          if (!state.farm) state.farm = defaultFarm;
          if (state.userProfile) {
            state.userProfile = {
              ...state.userProfile,
              wheelRewardedCount: state.userProfile.wheelRewardedCount ?? 0,
              wheelRewardDate: state.userProfile.wheelRewardDate ?? null,
            };
          }
          // 新增第 10-12 章：如果玩家已通关旧章节，自动推进到新章节
          if (state.storyProgress) {
            const sp = state.storyProgress;
            const unlocked: number[] = sp.unlockedChapters || [1];
            const defeated: number[] = sp.defeatedBosses || [];
            let current: number = sp.currentChapter || 1;
            while (defeated.includes(current)) {
              const next = CHAPTERS.find(c => c.id === current + 1);
              if (!next) break;
              if (!unlocked.includes(next.id)) unlocked.push(next.id);
              current = next.id;
            }
            state.storyProgress = {
              ...sp,
              currentChapter: current,
              unlockedChapters: unlocked,
            };
          }
        }

        // v12 -> v13: 家园建筑与农田扩建（3 块 -> 6 块）
        if (version < 13) {
          if (!state.farmBuildings) state.farmBuildings = defaultFarmBuildings;
          if (!state.farm) {
            state.farm = defaultFarm;
          } else {
            const plots = [...state.farm].slice(0, 6);
            const existingIds = new Set(plots.map(p => p.id));
            for (let id = 1; id <= 6; id++) {
              if (!existingIds.has(id)) {
                plots.push({ id, crop: null, progress: 0, required: 0, cost: 0, reward: 0 });
              }
            }
            state.farm = plots.sort((a, b) => a.id - b.id);
          }
        }

        // v13 -> v14: 移除伤害相关字段（pendingBossDamageBonus / pendingCoinDouble 布尔 / bossWeaken / bossBoost），新增支线进度与 pendingCoinDoubleTurns
        if (version < 14) {
          if (state.userProfile) {
            const up = { ...state.userProfile };
            // 把 pendingCoinDouble 布尔迁移为 pendingCoinDoubleTurns 次数
            const oldTurns = typeof up.pendingCoinDoubleTurns === 'number' ? up.pendingCoinDoubleTurns : 0;
            const legacyTurn = up.pendingCoinDouble ? 1 : 0;
            up.pendingCoinDoubleTurns = Math.max(oldTurns, legacyTurn);
            delete up.pendingCoinDouble;
            delete up.pendingBossDamageBonus;
            state.userProfile = up;
          }
          if (state.storyProgress) {
            const sp = { ...state.storyProgress };
            delete sp.bossWeaken;
            delete sp.bossBoost;
            sp.unlockedSideQuests = sp.unlockedSideQuests || [];
            sp.completedSideQuests = sp.completedSideQuests || [];
            sp.usedSideQuestOptions = sp.usedSideQuestOptions || {};
            state.storyProgress = sp;
          }
          // 清理已安装商店中的 bossSmash
          if (state.shopItems) {
            state.shopItems = state.shopItems.filter((i: any) => i.effect !== 'bossSmash');
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
            // daily 任务：跨天后清除完成时间并把日期更新为今天，实现每日重复
            if (t.status === 'daily' && t.completedAt && toLocalDateStr(t.completedAt) !== todayStr) {
              return { ...t, completedAt: null, dueDate: t.dueDate ? todayStr : t.dueDate };
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
export { CHAPTERS };

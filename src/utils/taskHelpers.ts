import type { Task, Category, RepeatType } from '../types';
import { getTodayStr, daysBetween } from './id';
import { isWorkday, CN_HOLIDAYS } from '../data/holidays';

export function priorityColor(priority: Task['priority']): string {
  switch (priority) {
    case 'high': return 'var(--color-high)';
    case 'medium': return 'var(--color-medium)';
    case 'low': return 'var(--color-low)';
    default: return 'var(--color-text-light)';
  }
}

export function priorityLabel(priority: Task['priority']): string {
  switch (priority) {
    case 'high': return '高';
    case 'medium': return '中';
    case 'low': return '低';
    default: return '无';
  }
}

export function statusLabel(status: Task['status']): string {
  switch (status) {
    case 'todo': return '待办';
    case 'doing': return '进行中';
    case 'daily': return '每日';
    case 'done': return '已完成';
  }
}

export function getCategoryName(categories: Category[], categoryId: string | null): string {
  if (!categoryId) return '';
  return categories.find(c => c.id === categoryId)?.name || '';
}

export function getCategoryColor(categories: Category[], categoryId: string | null): string {
  if (!categoryId) return '#b2bec3';
  return categories.find(c => c.id === categoryId)?.color || '#b2bec3';
}

export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateStr.substring(0, 10) === todayStr;
}

export function isOverdue(dateStr: string | null, status: Task['status']): boolean {
  if (!dateStr || status === 'done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  if (diff === -1) return '昨天';
  if (diff < 0) return `${Math.abs(diff)}天前`;
  if (diff <= 7) return `${diff}天后`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * 判断任务是否应该显示为今日任务
 * 包括：截止日期为今天，或自定义周几重复且今天在重复日中
 */
export function isTaskToday(task: Task): boolean {
  if (task.status === 'done') return false;
  if (task.archived) return false;
  if (task.parentId) return false;

  // daily 状态的任务永远是当日任务
  if (task.status === 'daily') return true;

  // 截止日期是今天
  if (isToday(task.dueDate)) return true;

  // 自定义周几重复，且今天是重复日
  if (task.repeat === 'weekdays' && task.repeatWeekdays && task.repeatWeekdays.length > 0) {
    const todayDay = new Date().getDay();
    return task.repeatWeekdays.includes(todayDay);
  }

  return false;
}

/**
 * 解析 YYYY-MM-DD 为本地时间日期对象（避免时区偏移）
 */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.substring(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** 将日期对象格式化为 YYYY-MM-DD（本地时间） */
function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 计算重复任务的下一次日期（严格晚于当前 dueDate）
 * 用于完成任务时，为新的重复任务设定对应的日期
 */
export function advanceOccurrence(
  dueDate: string,
  repeat: RepeatType,
  repeatWeekdays?: number[],
): string {
  const base = parseLocalDate(dueDate);

  switch (repeat) {
    case 'daily': {
      base.setDate(base.getDate() + 1);
      return formatLocalDate(base);
    }
    case 'weekly': {
      base.setDate(base.getDate() + 7);
      return formatLocalDate(base);
    }
    case 'biweekly': {
      base.setDate(base.getDate() + 14);
      return formatLocalDate(base);
    }
    case 'monthly': {
      base.setMonth(base.getMonth() + 1);
      return formatLocalDate(base);
    }
    case 'weekdays': {
      if (!repeatWeekdays || repeatWeekdays.length === 0) return dueDate;
      for (let i = 1; i <= 14; i++) {
        const next = new Date(base);
        next.setDate(base.getDate() + i);
        if (repeatWeekdays.includes(next.getDay())) return formatLocalDate(next);
      }
      return dueDate;
    }
    case 'workdays': {
      for (let i = 1; i <= 15; i++) {
        const next = new Date(base);
        next.setDate(base.getDate() + i);
        if (isWorkday(formatLocalDate(next))) return formatLocalDate(next);
      }
      return dueDate;
    }
    case 'holidays': {
      const sorted = CN_HOLIDAYS.map(h => h.date).sort();
      const next = sorted.find(d => d > dueDate.substring(0, 10));
      return next || sorted[0];
    }
    default:
      return dueDate;
  }
}

/**
 * 计算重复任务在指定日期（含）之后的第一次执行日期
 * 用于展示距离下次执行还差几天
 */
export function nextOccurrenceOnOrAfter(
  dueDate: string | null,
  repeat: RepeatType,
  repeatWeekdays: number[] | undefined,
  fromStr: string,
): string | null {
  if (repeat === 'none') return dueDate;
  if (!dueDate) return null;

  let cur = dueDate.substring(0, 10);
  let guard = 0;
  while (cur < fromStr && guard < 400) {
    const next = advanceOccurrence(cur, repeat, repeatWeekdays);
    if (next === cur) break; // 防止死循环
    cur = next;
    guard++;
  }
  return cur;
}

/**
 * 计算任务距离下次执行还有几天
 * @returns 负数表示已过期，0表示今天，正数表示未来天数
 */
export function getDaysUntilDue(task: Task): number | null {
  if (task.status === 'done') return null;
  if (!task.dueDate) return null;

  const todayStr = getTodayStr();
  let target = task.dueDate.substring(0, 10);

  // 重复任务：滚动到下一次实际执行日期后再计算
  if (task.repeat !== 'none') {
    target = nextOccurrenceOnOrAfter(target, task.repeat, task.repeatWeekdays, todayStr) || target;
  }

  return daysBetween(todayStr, target);
}

/**
 * 格式化距离天数为可读文字
 */
export function formatDaysUntil(days: number | null): string {
  if (days === null) return '';
  if (days === 0) return '今天';
  if (days === 1) return '明天';
  if (days === -1) return '昨天';
  if (days < 0) return `逾期${Math.abs(days)}天`;
  if (days <= 7) return `还差${days}天`;
  return `还差${days}天`;
}

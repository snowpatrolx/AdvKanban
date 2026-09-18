import type { Task, Category } from '../types';

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
 * 计算重复任务距离下次执行还有几天
 * @returns 负数表示已过期，0表示今天，正数表示未来天数
 */
export function getDaysUntilDue(task: Task): number | null {
  if (task.status === 'done') return null;
  if (!task.dueDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // 非重复任务直接返回差值
  if (task.repeat === 'none') return diff;

  // 重复任务：如果已过期，计算下一个周期
  if (diff < 0) {
    return getNextRepeatDays(task);
  }

  return diff;
}

/**
 * 计算重复任务距离下次执行的天数（当当前截止日期已过期时）
 */
function getNextRepeatDays(task: Task): number | null {
  if (!task.dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (task.repeat) {
    case 'daily':
      return 0; // 每天重复，今天就是下一次
    case 'weekly':
      return 7; // 每周重复，下次是7天后
    case 'biweekly':
      return 14; // 每两周重复
    case 'monthly': {
      // 找下个月的同一天
      const next = new Date(today);
      next.setMonth(next.getMonth() + 1);
      const nextDue = new Date(task.dueDate);
      nextDue.setFullYear(next.getFullYear(), next.getMonth(), nextDue.getDate());
      return Math.round((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
    case 'weekdays': {
      // 找下一个选中的星期几
      if (!task.repeatWeekdays || task.repeatWeekdays.length === 0) return null;
      for (let i = 0; i <= 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        if (task.repeatWeekdays.includes(d.getDay())) {
          return i;
        }
      }
      return null;
    }
    case 'workdays': {
      // 法定工作日：找下一个工作日
      for (let i = 0; i <= 15; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().substring(0, 10);
        // 引用 isWorkday 需要循环依赖，简化处理：周一到周五
        const day = d.getDay();
        if (day >= 1 && day <= 5) return i;
      }
      return null;
    }
    case 'holidays': {
      // 法定节假日：简化为返回30（不确定具体天数）
      return null;
    }
    default:
      return null;
  }
}

/**
 * 格式化距离天数为可读文字
 */
export function formatDaysUntil(days: number | null): string {
  if (days === null) return '';
  if (days === 0) return '今天';
  if (days === 1) return '明天';
  if (days === -1) return '昨天';
  if (days < 0) return `${Math.abs(days)}天前`;
  if (days <= 7) return `${days}天后`;
  return `${days}天后`;
}

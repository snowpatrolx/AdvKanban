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

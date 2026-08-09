/** 生成唯一 ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/** 获取今天的日期字符串 YYYY-MM-DD */
export function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 将 ISO 日期字符串转为 YYYY-MM-DD */
export function toDateStr(iso: string): string {
  return iso.substring(0, 10);
}

/** 计算两个日期字符串（YYYY-MM-DD）相差的天数 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00');
  const d2 = new Date(date2 + 'T00:00:00');
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

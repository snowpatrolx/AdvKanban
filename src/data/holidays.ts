// 2026年中国法定节假日和调休工作日
// 数据来源：国务院办公厅关于2026年部分节假日安排的通知

export interface HolidayInfo {
  date: string;   // YYYY-MM-DD
  name: string;
}

// 法定节假日（休息日）
export const CN_HOLIDAYS: HolidayInfo[] = [
  // 元旦
  { date: '2026-01-01', name: '元旦' },
  { date: '2026-01-02', name: '元旦' },
  { date: '2026-01-03', name: '元旦' },
  // 春节
  { date: '2026-02-15', name: '春节' },
  { date: '2026-02-16', name: '春节' },
  { date: '2026-02-17', name: '春节' },
  { date: '2026-02-18', name: '春节' },
  { date: '2026-02-19', name: '春节' },
  { date: '2026-02-20', name: '春节' },
  { date: '2026-02-21', name: '春节' },
  // 清明节
  { date: '2026-04-04', name: '清明节' },
  { date: '2026-04-05', name: '清明节' },
  { date: '2026-04-06', name: '清明节' },
  // 劳动节
  { date: '2026-05-01', name: '劳动节' },
  { date: '2026-05-02', name: '劳动节' },
  { date: '2026-05-03', name: '劳动节' },
  { date: '2026-05-04', name: '劳动节' },
  { date: '2026-05-05', name: '劳动节' },
  // 端午节
  { date: '2026-06-19', name: '端午节' },
  { date: '2026-06-20', name: '端午节' },
  { date: '2026-06-21', name: '端午节' },
  // 中秋节
  { date: '2026-09-25', name: '中秋节' },
  { date: '2026-09-26', name: '中秋节' },
  { date: '2026-09-27', name: '中秋节' },
  // 国庆节
  { date: '2026-10-01', name: '国庆节' },
  { date: '2026-10-02', name: '国庆节' },
  { date: '2026-10-03', name: '国庆节' },
  { date: '2026-10-04', name: '国庆节' },
  { date: '2026-10-05', name: '国庆节' },
  { date: '2026-10-06', name: '国庆节' },
  { date: '2026-10-07', name: '国庆节' },
];

// 调休工作日（周末需要上班的日子）
export const CN_ADJUSTED_WORKDAYS: string[] = [
  '2026-02-14', // 春节前调休（周六）
  '2026-02-22', // 春节后调休（周日）
  '2026-04-03', // 清明节前调休（周五）
  '2026-04-26', // 劳动节前调休（周日）
  '2026-06-28', // 端午节后调休（周日）
  '2026-10-10', // 国庆节后调休（周六）
];

// 获取所有节假日日期集合
export const HOLIDAY_DATES = new Set(CN_HOLIDAYS.map(h => h.date));

// 判断某天是否为法定节假日（含周末）
export function isHoliday(dateStr: string): boolean {
  // 法定节假日
  if (HOLIDAY_DATES.has(dateStr)) return true;
  // 周末（周六、周日）
  const day = new Date(dateStr).getDay();
  if (day === 0 || day === 6) return true;
  return false;
}

// 判断某天是否为法定工作日（周一到周五且非节假日，或调休工作日）
export function isWorkday(dateStr: string): boolean {
  // 调休工作日
  if (CN_ADJUSTED_WORKDAYS.includes(dateStr)) return true;
  // 法定节假日
  if (isHoliday(dateStr)) return false;
  // 周一到周五
  const day = new Date(dateStr).getDay();
  return day >= 1 && day <= 5;
}

// 获取节假日名称
export function getHolidayName(dateStr: string): string | null {
  const holiday = CN_HOLIDAYS.find(h => h.date === dateStr);
  return holiday ? holiday.name : null;
}

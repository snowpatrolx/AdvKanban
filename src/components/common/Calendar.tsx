import { useState, useMemo, useEffect } from 'react';
import './Calendar.css';

export interface CalendarProps {
  /** 需要高亮的日期（YYYY-MM-DD） */
  highlightedDates?: string[] | Set<string>;
  /** 每个日期对应的数量徽章（可选） */
  counts?: Record<string, number>;
  /** 当前选中的日期 */
  selectedDate?: string | null;
  /** 点击日期回调 */
  onSelectDate?: (date: string) => void;
  /** 初始展示的月份锚点日期 */
  initialDate?: string;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function toDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export function Calendar({ highlightedDates, counts, selectedDate, onSelectDate, initialDate }: CalendarProps) {
  const highlightSet = useMemo(() => {
    if (!highlightedDates) return new Set<string>();
    return highlightedDates instanceof Set ? highlightedDates : new Set(highlightedDates);
  }, [highlightedDates]);

  const todayStr = toDateStr(new Date());
  const anchor = selectedDate || initialDate || todayStr;
  const anchorY = parseInt(anchor.slice(0, 4), 10);
  const anchorM = parseInt(anchor.slice(5, 7), 10) - 1;

  const [viewYear, setViewYear] = useState(anchorY);
  const [viewMonth, setViewMonth] = useState(anchorM);

  // 外部选中/锚点变化时，跳转到对应月份
  useEffect(() => {
    setViewYear(anchorY);
    setViewMonth(anchorM);
  }, [anchorY, anchorM]);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startOffset = (first.getDay() + 6) % 7; // 周一为一周起点
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const arr: { date: string; day: number; inMonth: boolean }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth, -i);
      arr.push({ date: toDateStr(d), day: d.getDate(), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push({ date: `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`, day: d, inMonth: true });
    }
    let n = 1;
    while (arr.length < 42) {
      const d = new Date(viewYear, viewMonth + 1, n++);
      arr.push({ date: toDateStr(d), day: d.getDate(), inMonth: false });
    }
    return arr;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="calendar-nav" onClick={prevMonth} aria-label="上个月" type="button">‹</button>
        <span className="calendar-title">{viewYear} 年 {viewMonth + 1} 月</span>
        <button className="calendar-nav" onClick={nextMonth} aria-label="下个月" type="button">›</button>
      </div>
      <div className="calendar-weekdays">
        {WEEKDAYS.map(w => (
          <div key={w} className="calendar-weekday">{w}</div>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map(c => {
          const has = highlightSet.has(c.date);
          const isToday = c.date === todayStr;
          const isSelected = c.date === selectedDate;
          const cnt = counts?.[c.date];
          return (
            <button
              key={c.date}
              type="button"
              className={[
                'calendar-cell',
                c.inMonth ? '' : 'out',
                has ? 'has' : '',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onSelectDate?.(c.date)}
            >
              <span className="calendar-day">{c.day}</span>
              {has && cnt != null && cnt > 0 && (
                <span className="calendar-count">{cnt}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

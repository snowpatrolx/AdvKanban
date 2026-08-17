import * as XLSX from 'xlsx';
import type { Task, Category, DailyRecord, UserProfile } from '../types';

export function exportTasksToExcel(tasks: Task[], categories: Category[]) {
  const categoryNameMap = new Map(categories.map(c => [c.id, c.name]));

  const data = tasks.map(t => ({
    '标题': t.title,
    '描述': t.description,
    '状态': t.status === 'todo' ? '待办' : t.status === 'doing' ? '进行中' : '已完成',
    '优先级': t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : t.priority === 'low' ? '低' : '无',
    '分类': t.categoryId ? categoryNameMap.get(t.categoryId) || '未分类' : '未分类',
    '截止日期': t.dueDate || '',
    '创建时间': t.createdAt,
    '完成时间': t.completedAt || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 30 }, { wch: 40 }, { wch: 10 }, { wch: 8 },
    { wch: 12 }, { wch: 12 }, { wch: 22 }, { wch: 22 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '任务列表');
  XLSX.writeFile(wb, `任务导出_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function downloadJSON(jsonStr: string, filename: string) {
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 生成近一周任务情况文本报告
 */
export function exportWeeklyReport(
  tasks: Task[],
  categories: Category[],
  dailyRecords: DailyRecord[],
  userProfile: UserProfile,
) {
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const categoryNameMap = new Map(categories.map(c => [c.id, c.name]));
  const todayStr = now.toISOString().substring(0, 10);
  const weekAgoStr = weekAgo.toISOString().substring(0, 10);

  // 筛选近一周相关任务
  const weekTasks = tasks.filter(t => !t.parentId && (
    (t.createdAt >= weekAgoStr) ||
    (t.completedAt && t.completedAt.substring(0, 10) >= weekAgoStr) ||
    (t.status !== 'done' && t.dueDate && t.dueDate >= weekAgoStr)
  ));

  const completedThisWeek = weekTasks.filter(t =>
    t.status === 'done' && t.completedAt && t.completedAt.substring(0, 10) >= weekAgoStr
  );
  const stillPending = weekTasks.filter(t => t.status !== 'done');
  const overdue = stillPending.filter(t => t.dueDate && t.dueDate < todayStr);

  // 近7天每日数据
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDailyData: { date: string; label: string; count: number; points: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().substring(0, 10);
    const record = dailyRecords.find(r => r.date === dateStr);
    weekDailyData.push({
      date: dateStr,
      label: `${d.getMonth() + 1}/${d.getDate()} ${dayNames[d.getDay()]}`,
      count: record?.completedCount || 0,
      points: record?.pointsEarned || 0,
    });
  }

  // 分类统计
  const categoryStats = categories.map(c => {
    const catTasks = weekTasks.filter(t => t.categoryId === c.id);
    return {
      name: c.name,
      total: catTasks.length,
      done: catTasks.filter(t => t.status === 'done').length,
    };
  }).filter(c => c.total > 0);

  // 生成文本
  let report = '';
  report += '========================================\n';
  report += '       冒险清单 - 近一周任务报告\n';
  report += '========================================\n\n';
  report += `生成时间：${now.toLocaleString('zh-CN')}\n`;
  report += `报告区间：${weekAgoStr} ~ ${todayStr}\n\n`;

  // 概览
  report += '---------- 概览 ----------\n';
  report += `本周完成任务：${completedThisWeek.length} 个\n`;
  report += `当前待办/进行中：${stillPending.length} 个\n`;
  report += `逾期任务：${overdue.length} 个\n`;
  report += `累计完成任务：${userProfile.completedTaskCount} 个\n`;
  report += `当前等级：Lv.${userProfile.level}（${userProfile.totalPoints} EXP）\n`;
  report += `连续打卡：${userProfile.currentStreak} 天（最长 ${userProfile.longestStreak} 天）\n\n`;

  // 每日数据
  report += '---------- 每日完成情况 ----------\n';
  weekDailyData.forEach(d => {
    const bar = '█'.repeat(Math.min(d.count, 20)) + '░'.repeat(Math.max(0, 20 - d.count));
    report += `${d.label}  ${bar}  ${d.count}个 / +${d.points}EXP\n`;
  });
  const weekTotal = weekDailyData.reduce((s, d) => s + d.count, 0);
  const weekPoints = weekDailyData.reduce((s, d) => s + d.points, 0);
  report += `\n本周合计：${weekTotal} 个任务，${weekPoints} 经验值\n\n`;

  // 分类统计
  if (categoryStats.length > 0) {
    report += '---------- 分类统计 ----------\n';
    categoryStats.forEach(c => {
      const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
      report += `${c.name}：${c.done}/${c.total} 完成（${pct}%）\n`;
    });
    report += '\n';
  }

  // 已完成任务列表
  if (completedThisWeek.length > 0) {
    report += '---------- 本周已完成 ----------\n';
    completedThisWeek
      .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
      .forEach(t => {
        const cat = t.categoryId ? categoryNameMap.get(t.categoryId) : '';
        const priority = t.priority === 'high' ? '[高优先] ' : '';
        const date = t.completedAt ? t.completedAt.substring(0, 10) : '';
        report += `✓ ${priority}${t.title}`;
        if (cat) report += ` [${cat}]`;
        report += `  ${date}\n`;
      });
    report += '\n';
  }

  // 待处理任务
  if (stillPending.length > 0) {
    report += '---------- 待处理任务 ----------\n';
    const overdueList = stillPending.filter(t => t.dueDate && t.dueDate < todayStr);
    const normalList = stillPending.filter(t => !t.dueDate || t.dueDate >= todayStr);

    if (overdueList.length > 0) {
      report += `⚠ 逾期（${overdueList.length}个）：\n`;
      overdueList.forEach(t => {
        const cat = t.categoryId ? categoryNameMap.get(t.categoryId) : '';
        const priority = t.priority === 'high' ? '[高优先] ' : '';
        report += `  ✗ ${priority}${t.title}`;
        if (cat) report += ` [${cat}]`;
        if (t.dueDate) report += ` 截止:${t.dueDate}`;
        report += '\n';
      });
    }

    if (normalList.length > 0) {
      report += `\n待办/进行中（${normalList.length}个）：\n`;
      normalList.forEach(t => {
        const cat = t.categoryId ? categoryNameMap.get(t.categoryId) : '';
        const priority = t.priority === 'high' ? '[高优先] ' : '';
        const status = t.status === 'doing' ? '⏳' : '○';
        report += `  ${status} ${priority}${t.title}`;
        if (cat) report += ` [${cat}]`;
        if (t.dueDate) report += ` 截止:${t.dueDate}`;
        report += '\n';
      });
    }
    report += '\n';
  }

  report += '========================================\n';
  report += '       由冒险清单自动生成\n';
  report += '========================================\n';

  downloadText(report, `周报_${todayStr}.txt`);
}

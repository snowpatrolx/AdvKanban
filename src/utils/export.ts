import * as XLSX from 'xlsx';
import type { Task, Category } from '../types';

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

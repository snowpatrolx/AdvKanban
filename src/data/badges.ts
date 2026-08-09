import type { Badge } from '../types';

export const BADGES: Badge[] = [
  { id: 'first_task', name: '初出茅庐', description: '完成第 1 个任务', icon: 'seedling', condition: 'first_task' },
  { id: 'ten_tasks', name: '小有成就', description: '累计完成 10 个任务', icon: 'star', condition: 'ten_tasks' },
  { id: 'fifty_tasks', name: '任务达人', description: '累计完成 50 个任务', icon: 'trophy', condition: 'fifty_tasks' },
  { id: 'streak_3', name: '连续三天', description: '连续 3 天完成任务', icon: 'flame', condition: 'streak_3' },
  { id: 'streak_7', name: '一周连胜', description: '连续 7 天完成任务', icon: 'gem', condition: 'streak_7' },
  { id: 'first_knowledge', name: '知识播种', description: '创建第 1 条知识', icon: 'edit', condition: 'first_knowledge' },
  { id: 'ten_knowledge', name: '知识积累', description: '创建 10 条知识', icon: 'books', condition: 'ten_knowledge' },
  { id: 'dragon_slayer', name: '屠龙者', description: '通关全部故事章节', icon: 'dragon', condition: 'dragon_slayer' },
];

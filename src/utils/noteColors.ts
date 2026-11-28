// 便签统一配色：全部改为深色底 + 浅色文字，保证可读性
// NotesPage 与 NotesModal 共用此配置，避免两处色板不一致

export interface NoteColorOption {
  bg: string;   // 背景色（深色）
  text: string; // 文字色（与背景高对比的浅色）
}

export const NOTE_COLOR_OPTIONS: NoteColorOption[] = [
  { bg: '#1e3a5f', text: '#e8f1ff' }, // 深海蓝
  { bg: '#2d6a4f', text: '#e6f7ee' }, // 深林绿
  { bg: '#6a1b1b', text: '#ffe8e8' }, // 酒红
  { bg: '#5a3e1b', text: '#fff4e0' }, // 焦糖棕
  { bg: '#3d2b5c', text: '#f0e8ff' }, // 深紫
  { bg: '#2b2b2b', text: '#f0f0f0' }, // 炭黑
];

/** 仅背景色数组，用于色板渲染 */
export const NOTE_COLORS = NOTE_COLOR_OPTIONS.map(o => o.bg);

/** 默认便签颜色 */
export const DEFAULT_NOTE_COLOR = NOTE_COLORS[0];

/** 根据背景色取对应的高对比文字色；未知颜色回退白色 */
export function noteTextColor(bg: string | undefined | null): string {
  if (!bg) return '#ffffff';
  return NOTE_COLOR_OPTIONS.find(o => o.bg === bg)?.text || '#ffffff';
}

/** 判断颜色是否在当前色板中（迁移时用于把旧浅色替换为默认深色） */
export function isKnownNoteColor(bg: string | undefined | null): boolean {
  if (!bg) return false;
  return NOTE_COLOR_OPTIONS.some(o => o.bg === bg);
}

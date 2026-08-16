// Flat SVG icon components - no emoji, all flat design

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const defaultProps = (size: number, color: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

// Home / Tasks icon - checklist
export function IconTasks({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10l2 2 4-4" />
      <path d="M8 16l2 2 4-4" />
    </svg>
  );
}

// Knowledge / Book icon
export function IconBook({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M4 4v16a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1z" />
      <path d="M4 4a1 1 0 0 1 1-1h13" />
      <path d="M9 9h6M9 13h6" />
    </svg>
  );
}

// Adventure / Map icon
export function IconMap({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}

// AI / Sparkle icon
export function IconAI({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// User / Profile icon
export function IconUser({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}

// Plus icon
export function IconPlus({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// Search icon
export function IconSearch({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

// Calendar icon
export function IconCalendar({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18M8 2v4M16 2v4" />
    </svg>
  );
}

// Check icon
export function IconCheck({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

// Check circle (filled)
export function IconCheckCircle({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="10" fill={color} />
      <path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// Back arrow icon
export function IconBack({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

// Arrow right icon
export function IconArrowRight({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

// Trash icon
export function IconTrash({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

// Tag icon
export function IconTag({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9z" />
      <circle cx="8" cy="8" r="1.5" fill={color} />
    </svg>
  );
}

// Database / Storage icon
export function IconDatabase({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
      <path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
    </svg>
  );
}

// Download icon
export function IconDownload({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

// Upload icon
export function IconUpload({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M12 15V3M7 8l5-5 5 5" />
      <path d="M5 21h14" />
    </svg>
  );
}

// Flame icon (for streak)
export function IconFlame({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M12 2c0 0-4 4-4 8 0 2 1 3 1 3s-3 1-3 5c0 3 3 4 6 4s6-1 6-4c0-4-3-5-3-5s1-1 1-3c0-4-4-8-4-8z" />
    </svg>
  );
}

// List view icon
export function IconList({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

// Kanban / Columns view icon
export function IconColumns({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <rect x="3" y="3" width="6" height="18" rx="1" />
      <rect x="15" y="3" width="6" height="18" rx="1" />
    </svg>
  );
}

// Send icon (for AI chat)
export function IconSend({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

// Star icon (for points)
export function IconStar({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
    </svg>
  );
}

// Trophy icon (for badges)
export function IconTrophy({ size = 28, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 4H4v3a3 3 0 0 0 3 3M17 4h3v3a3 3 0 0 1-3 3" />
    </svg>
  );
}

// Sword icon (for boss battle)
export function IconSword({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M14.5 3l6.5 6.5L9 21.5 3 15.5 14.5 3z" />
      <path d="M3 21l3-3M14 9l1-1" />
    </svg>
  );
}

// Refresh / Reset icon
export function IconRefresh({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
    </svg>
  );
}

// Lock icon
export function IconLock({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

// Location pin icon
export function IconPin({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// Document icon
export function IconDocument({ size = 48, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
      <path d="M14 2v6h6M8 13h8M8 17h8" />
    </svg>
  );
}

// Seedling icon (first task badge)
export function IconSeedling({ size = 28, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22V12" />
      <path d="M12 12c0-3-2-5-5-5-2 0-3 1-3 1s1 4 4 4h4z" fill={color} fillOpacity="0.15" />
      <path d="M12 12c0-3 2-5 5-5 2 0 3 1 3 1s-1 4-4 4h-4z" fill={color} fillOpacity="0.15" />
      <path d="M7 20h10" />
    </svg>
  );
}

// Star badge icon (ten tasks)
export function IconStarBadge({ size = 28, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
      <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6-6.3 4.6L7.9 14 2 9.4h7.6z" />
    </svg>
  );
}

// Gem icon (streak 7 badge)
export function IconGem({ size = 28, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 3h12l4 6-10 12L2 9z" />
      <path d="M2 9h20M8 3L6 9l6 12M16 3l2 6-6 12" />
    </svg>
  );
}

// Edit icon (first knowledge badge)
export function IconEdit({ size = 28, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

// Books icon (ten knowledge badge)
export function IconBooks({ size = 28, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M9 7h7M9 11h4" />
    </svg>
  );
}

// Dragon icon (story complete badge)
export function IconDragon({ size = 28, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 8c0-2 2-3 4-3 0-1 1-2 2-2s2 1 2 2c2 0 4 1 4 3 2 0 3 1 3 3v1c0 2-1 3-3 3-1 2-3 3-5 3h-4c-2 0-4-1-5-3-2 0-3-1-3-3v-1c0-2 1-3 3-3z" />
      <circle cx="15" cy="9" r="1" fill={color} />
      <path d="M8 14l-2 3M12 15v3M16 14l2 3" />
    </svg>
  );
}

// Chart icon (for data/export)
export function IconChart({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 3 5-5" />
    </svg>
  );
}

// Folder icon (for import)
export function IconFolder({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

// Warning icon
export function IconWarning({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M12 2L1 21h22z" />
      <path d="M12 9v5M12 17h.01" />
    </svg>
  );
}

// Close / X icon
export function IconClose({ size = 20, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  );
}

// Repeat icon (for recurring tasks)
export function IconRepeat({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

// Link icon (for knowledge article links)
export function IconLink({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  );
}

// Chevron down icon (for expand/collapse)
export function IconChevronDown({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// Chevron right icon
export function IconChevronRight({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// Subtask / nested list icon
export function IconSubtask({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg {...defaultProps(size, color)} className={className}>
      <path d="M3 6h6M3 18h6" />
      <path d="M9 6v12" />
      <rect x="14" y="3" width="7" height="6" rx="1" />
      <rect x="14" y="15" width="7" height="6" rx="1" />
    </svg>
  );
}

// Drag handle icon (for reordering)
export function IconDrag({ size = 16, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

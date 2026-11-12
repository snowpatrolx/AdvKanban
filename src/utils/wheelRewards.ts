import { getTodayStr } from './id';

export type WheelRewardKind = 'coins' | 'shield' | 'coinDouble' | 'bossBonus' | 'points' | 'farmBoost';

export interface WheelReward {
  at: 4 | 8 | 12;
  kind: WheelRewardKind;
  amount: number;
  icon: string;
  short: string;
  label: string;
}

// 每个里程碑的奖励池，按日期确定性随机抽取，保证一天内稳定、每天刷新
const POOLS: Record<number, WheelRewardKind[]> = {
  4: ['coins', 'coins', 'coins', 'points', 'points', 'farmBoost', 'farmBoost', 'shield'],
  8: ['coins', 'coins', 'coins', 'shield', 'shield', 'coinDouble', 'coinDouble', 'bossBonus', 'bossBonus', 'points'],
  12: ['coins', 'coins', 'shield', 'shield', 'coinDouble', 'coinDouble', 'bossBonus', 'bossBonus', 'points'],
};

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand(seed: number): number {
  let x = seed || 1;
  x ^= x << 13; x >>>= 0;
  x ^= x >> 17;
  x ^= x << 5; x >>>= 0;
  return x / 4294967296;
}

function pickAmount(at: number, min: number, max: number, seed: number): number {
  return min + Math.floor(rand(seed) * (max - min + 1));
}

function buildReward(at: 4 | 8 | 12, kind: WheelRewardKind, seed: number): WheelReward {
  switch (kind) {
    case 'coins': {
      const ranges: Record<number, [number, number]> = { 4: [15, 25], 8: [30, 45], 12: [50, 70] };
      const [min, max] = ranges[at];
      const amount = pickAmount(at, min, max, seed);
      return { at, kind, amount, icon: '◉', short: `+${amount}`, label: `+${amount} 金币` };
    }
    case 'shield': {
      const amount = at === 12 ? 2 : 1;
      return { at, kind, amount, icon: '🛡', short: '🛡', label: `护盾 ×${amount}` };
    }
    case 'coinDouble':
      return { at, kind, amount: 1, icon: '✦', short: '2×', label: '双倍金币券' };
    case 'bossBonus': {
      const amounts: Record<number, number> = { 4: 30, 8: 50, 12: 80 };
      const amount = amounts[at];
      return { at, kind, amount, icon: '⚔', short: '⚔', label: `Boss 伤害 +${amount}` };
    }
    case 'points': {
      const amounts: Record<number, number> = { 4: 20, 8: 35, 12: 60 };
      const amount = amounts[at];
      return { at, kind, amount, icon: '★', short: `+${amount}`, label: `+${amount} 经验` };
    }
    case 'farmBoost': {
      const amounts: Record<number, number> = { 4: 2, 8: 3, 12: 4 };
      const amount = amounts[at];
      return { at, kind, amount, icon: '🌱', short: '🌱', label: `作物成长 +${amount}` };
    }
  }
}

/** 获取指定日期的轮盘节点奖励（同一天结果固定，每天随机刷新） */
export function getDailyWheelRewards(dateStr: string = getTodayStr()): WheelReward[] {
  const rewards = ([4, 8, 12] as const).map(at => {
    const seed = hashString(`${dateStr}-wheel-${at}`);
    const pool = POOLS[at];
    const kind = pool[Math.floor(rand(seed) * pool.length)];
    return buildReward(at, kind, hashString(`${dateStr}-wheel-${at}-${kind}`));
  });

  // 避免三个节点完全相同，保证每天有变化
  if (rewards.every(r => r.kind === rewards[0].kind)) {
    const altPool = POOLS[12].filter(k => k !== rewards[0].kind);
    const altKind = altPool[hashString(`${dateStr}-wheel-alt`) % altPool.length];
    rewards[2] = buildReward(12, altKind, hashString(`${dateStr}-wheel-12-alt-${altKind}`));
  }

  return rewards;
}

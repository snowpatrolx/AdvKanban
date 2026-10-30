import { useNavigate } from 'react-router-dom';
import { useStore, APP_VERSION } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import { getLevelProgress, LEVELS } from '../utils/gamification';
import { BADGES } from '../data/badges';
import { CHAPTERS } from '../data/chapters';
import {
  IconFlame, IconTag, IconDatabase, IconArrowRight, IconTrophy, IconCheck,
  IconSeedling, IconStarBadge, IconGem, IconEdit, IconBooks, IconDragon, IconAI,
  IconFolder, IconCoins,
} from '../components/common/Icons';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { userProfile, userBadges, tasks, storyProgress, archiveCompletedTasks, shopBuyStreakShield, shopBuyCoinDouble, shopBuyBossSmash, shopBuyQuickComplete } = useStore();
  const addToast = useToastStore(s => s.addToast);
  const levelInfo = getLevelProgress(userProfile.totalPoints);

  // 可批量归档的已完成任务数量
  const archiveableCount = tasks.filter(t => !t.parentId && t.status === 'done' && !t.archived).length;

  const handleBatchArchive = () => {
    if (archiveableCount === 0) {
      addToast({ icon: '!', title: '没有可归档的已完成任务' });
      return;
    }
    const count = archiveCompletedTasks();
    addToast({ icon: '▼', title: `已归档 ${count} 个已完成任务` });
  };

  // 金币商店购买
  const handleBuyStreakShield = () => {
    if (shopBuyStreakShield()) {
      addToast({ icon: '◉', title: '购买成功：连续天数护盾', subtitle: '下次断签自动保持' });
    } else {
      addToast({ icon: '!', title: '金币不足', subtitle: '需要 50 金币' });
    }
  };
  const handleBuyCoinDouble = () => {
    if (shopBuyCoinDouble()) {
      addToast({ icon: '◉', title: '购买成功：双倍金币', subtitle: '下一次任务生效' });
    } else if (userProfile.pendingCoinDouble) {
      addToast({ icon: '!', title: '已有双倍金币待生效' });
    } else {
      addToast({ icon: '!', title: '金币不足', subtitle: '需要 30 金币' });
    }
  };
  const handleBuyBossSmash = () => {
    if (shopBuyBossSmash()) {
      addToast({ icon: '⚔', title: '购买成功：Boss 重击', subtitle: '对当前 Boss 造成 30 伤害' });
    } else {
      addToast({ icon: '!', title: '无法购买', subtitle: '需要 100 金币 & 当前有未击败的 Boss' });
    }
  };
  const handleBuyQuickComplete = () => {
    if (shopBuyQuickComplete()) {
      addToast({ icon: '★', title: '购买成功：立即完成任务', subtitle: '自动完成一个待办任务' });
    } else {
      addToast({ icon: '!', title: '无法购买', subtitle: '需要 200 金币 & 有待办任务' });
    }
  };

  return (
    <div className="page profile-page">
      {/* 用户卡片 */}
      <div className="profile-hero-card">
        <div className="profile-avatar">
          <span className="profile-avatar-level">Lv.{levelInfo.level}</span>
        </div>
        <div className="profile-hero-info">
          <h2 className="profile-hero-name">{levelInfo.name}</h2>
          <p className="profile-hero-points">{userProfile.totalPoints} 经验值</p>
        </div>
      </div>

      {/* 等级进度 */}
      <div className="card">
        <div className="profile-section-header">
          <h3>等级进度</h3>
          <span className="profile-level-next">
            {levelInfo.pointsToNext !== null ? `距 Lv.${levelInfo.level + 1} 还需 ${levelInfo.pointsToNext}` : '已满级'}
          </span>
        </div>
        <div className="progress-bar" style={{ height: 12 }}>
          <div className="progress-fill" style={{ width: `${levelInfo.progress}%` }} />
        </div>
        <div className="profile-level-table">
          {LEVELS.map(lv => (
            <div
              key={lv.level}
              className={`profile-level-row ${lv.level === levelInfo.level ? 'current' : ''} ${userProfile.totalPoints >= lv.minPoints ? 'achieved' : ''}`}
            >
              <span className="profile-level-num">Lv.{lv.level}</span>
              <span className="profile-level-name">{lv.name}</span>
              <span className="profile-level-pts">{lv.minPoints}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 统计 */}
      <div className="profile-stats-grid">
        <div className="profile-stat-item">
          <span className="profile-stat-num" style={{ color: '#ffd93d', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
            <IconCoins size={18} color="#ffd93d" /> {userProfile.coins}
          </span>
          <span className="profile-stat-label">金币</span>
        </div>
        <div className="profile-stat-item">
          <span className="profile-stat-num">{userProfile.completedTaskCount}</span>
          <span className="profile-stat-label">完成任务</span>
        </div>
        <div className="profile-stat-item">
          <span className="profile-stat-num profile-stat-flame">
            <IconFlame size={20} color="#e17055" /> {userProfile.currentStreak}
          </span>
          <span className="profile-stat-label">连续天数</span>
        </div>
        <div className="profile-stat-item">
          <span className="profile-stat-num">{userProfile.longestStreak}</span>
          <span className="profile-stat-label">最长连续</span>
        </div>
        <div className="profile-stat-item">
          <span className="profile-stat-num">{tasks.filter(t => !t.parentId && !t.archived).length}</span>
          <span className="profile-stat-label">活跃任务</span>
        </div>
      </div>

      {/* 金币商店 */}
      <div className="card">
        <div className="profile-section-header">
          <h3>
            <IconCoins size={18} color="#ffd93d" /> 金币商店
          </h3>
          <span className="profile-level-next">持有 {userProfile.coins} 金币</span>
        </div>
        <div className="coin-shop-list">
          <button className={`coin-shop-btn ${userProfile.coins < 50 ? 'disabled' : ''}`} onClick={handleBuyStreakShield} disabled={userProfile.coins < 50}>
            <div className="coin-shop-info">
              <span className="coin-shop-name">🛡 连续天数护盾</span>
              <span className="coin-shop-desc">下次断签自动保持天数</span>
            </div>
            <span className="coin-shop-cost"><IconCoins size={14} color="#ffd93d" /> 50</span>
          </button>

          <button className={`coin-shop-btn ${userProfile.coins < 30 || userProfile.pendingCoinDouble ? 'disabled' : ''}`} onClick={handleBuyCoinDouble} disabled={userProfile.coins < 30 || userProfile.pendingCoinDouble}>
            <div className="coin-shop-info">
              <span className="coin-shop-name">✦ 双倍金币券 {userProfile.pendingCoinDouble ? '(生效中)' : ''}</span>
              <span className="coin-shop-desc">下一次完成任务金币翻倍</span>
            </div>
            <span className="coin-shop-cost"><IconCoins size={14} color="#ffd93d" /> 30</span>
          </button>

          <button className={`coin-shop-btn ${userProfile.coins < 100 ? 'disabled' : ''}`} onClick={handleBuyBossSmash} disabled={userProfile.coins < 100}>
            <div className="coin-shop-info">
              <span className="coin-shop-name">⚔ Boss 重击</span>
              <span className="coin-shop-desc">对当前 Boss 直接造成 30 伤害</span>
            </div>
            <span className="coin-shop-cost"><IconCoins size={14} color="#ffd93d" /> 100</span>
          </button>

          <button className={`coin-shop-btn ${userProfile.coins < 200 ? 'disabled' : ''}`} onClick={handleBuyQuickComplete} disabled={userProfile.coins < 200}>
            <div className="coin-shop-info">
              <span className="coin-shop-name">⚡ 任务加速</span>
              <span className="coin-shop-desc">立即完成一个最高优先级任务</span>
            </div>
            <span className="coin-shop-cost"><IconCoins size={14} color="#ffd93d" /> 200</span>
          </button>
        </div>
        {userProfile.streakShields > 0 && (
          <div className="coin-shop-buff">
            🛡 护盾 × {userProfile.streakShields}
          </div>
        )}
      </div>

      {/* 徽章 */}
      <div className="card">
        <div className="profile-section-header">
          <h3>
            <IconTrophy size={18} color="var(--color-primary)" /> 徽章 ({userBadges.length}/{BADGES.length})
          </h3>
        </div>
        <div className="profile-badge-grid">
          {BADGES.map(badge => {
            const earned = userBadges.includes(badge.id);
            return (
              <div key={badge.id} className={`profile-badge ${earned ? 'earned' : 'locked'}`}>
                <div className="profile-badge-icon-wrap">
                  <BadgeIcon iconKey={badge.icon} earned={earned} />
                </div>
                <span className="profile-badge-name">{badge.name}</span>
                <span className="profile-badge-desc">{badge.description}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 菜单 */}
      <div className="profile-menu">
        <div className="profile-menu-item" onClick={handleBatchArchive}>
          <span className="profile-menu-label">
            <IconFolder size={20} color="var(--color-primary)" /> 批量归档已完成任务
          </span>
          <span style={{ fontSize: 12, color: 'var(--color-text-light)' }}>{archiveableCount} 个</span>
        </div>
        <div className="profile-menu-item" onClick={() => navigate('/ai')}>
          <span className="profile-menu-label">
            <IconAI size={20} color="var(--color-primary)" /> AI 分析
          </span>
          <IconArrowRight size={18} color="var(--color-text-light)" />
        </div>
        <div className="profile-menu-item" onClick={() => navigate('/categories')}>
          <span className="profile-menu-label">
            <IconTag size={20} color="var(--color-primary)" /> 分类管理
          </span>
          <IconArrowRight size={18} color="var(--color-text-light)" />
        </div>
        <div className="profile-menu-item" onClick={() => navigate('/data')}>
          <span className="profile-menu-label">
            <IconDatabase size={20} color="var(--color-primary)" /> 数据管理
          </span>
          <IconArrowRight size={18} color="var(--color-text-light)" />
        </div>
      </div>

      {/* 版本信息 */}
      <div className="profile-version">
        <span>轮盘清单 AdvKanban</span>
        <span>v{APP_VERSION}</span>
      </div>
    </div>
  );
}

// 徽章图标映射 - 使用平面化SVG图标
function BadgeIcon({ iconKey, earned }: { iconKey: string; earned: boolean }) {
  const color = earned ? 'var(--color-primary)' : 'var(--color-text-light)';
  const size = 28;

  switch (iconKey) {
    case 'seedling':
      return <IconSeedling size={size} color={color} />;
    case 'star':
      return <IconStarBadge size={size} color={color} />;
    case 'trophy':
      return <IconTrophy size={size} color={color} />;
    case 'flame':
      return <IconFlame size={size} color={color} />;
    case 'gem':
      return <IconGem size={size} color={color} />;
    case 'edit':
      return <IconEdit size={size} color={color} />;
    case 'books':
      return <IconBooks size={size} color={color} />;
    case 'dragon':
      return <IconDragon size={size} color={color} />;
    default:
      return <IconCheck size={size} color={color} />;
  }
}

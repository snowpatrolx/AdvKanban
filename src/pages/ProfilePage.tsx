import { useNavigate } from 'react-router-dom';
import { useStore, APP_VERSION } from '../store/useStore';
import { getLevelProgress, LEVELS } from '../utils/gamification';
import { BADGES } from '../data/badges';
import { CHAPTERS } from '../data/chapters';
import {
  IconFlame, IconTag, IconDatabase, IconArrowRight, IconTrophy, IconCheck,
  IconSeedling, IconStarBadge, IconGem, IconEdit, IconBooks, IconDragon,
} from '../components/common/Icons';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { userProfile, userBadges, knowledge, tasks, storyProgress } = useStore();
  const levelInfo = getLevelProgress(userProfile.totalPoints);

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
          <span className="profile-stat-num">{knowledge.length}</span>
          <span className="profile-stat-label">知识条目</span>
        </div>
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
        <span>冒险清单 AdvKanban</span>
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

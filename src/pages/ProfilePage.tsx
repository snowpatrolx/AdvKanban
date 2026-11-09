import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, APP_VERSION } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import { getLevelProgress, LEVELS } from '../utils/gamification';
import { BADGES } from '../data/badges';
import type { ShopEffect } from '../types';
import {
  IconFlame, IconTag, IconDatabase, IconArrowRight, IconTrophy, IconCheck,
  IconSeedling, IconStarBadge, IconGem, IconEdit, IconBooks, IconDragon, IconAI,
  IconFolder, IconCoins,
} from '../components/common/Icons';
import './ProfilePage.css';

const SHOP_EFFECT_OPTIONS: { value: ShopEffect; label: string }[] = [
  { value: 'streakShield', label: '连续天数护盾' },
  { value: 'coinDouble', label: '双倍金币券' },
  { value: 'bossSmash', label: 'Boss 重击' },
  { value: 'quickComplete', label: '任务加速' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const {
    userProfile, userBadges, tasks, archiveCompletedTasks,
    shopItems, buyShopItem, updateShopItem, addShopItem, deleteShopItem, resetShopItems,
  } = useStore();
  const addToast = useToastStore(s => s.addToast);
  const levelInfo = getLevelProgress(userProfile.totalPoints);
  const [editingShop, setEditingShop] = useState(false);

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
  const handleBuy = (itemId: string) => {
    if (buyShopItem(itemId)) {
      addToast({ icon: '◉', title: '购买成功', subtitle: '效果已生效' });
    } else {
      addToast({ icon: '!', title: '无法购买', subtitle: '金币不足或条件不满足' });
    }
  };

  const handleAddShopItem = () => {
    addShopItem({
      name: '新商品',
      desc: '点击编辑商品描述',
      cost: 50,
      icon: '🎁',
      effect: 'streakShield',
      enabled: true,
    });
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
          <div className="coin-shop-header-actions">
            <span className="profile-level-next">持有 {userProfile.coins} 金币</span>
            <button
              className={`coin-shop-edit-toggle ${editingShop ? 'active' : ''}`}
              onClick={() => setEditingShop(v => !v)}
            >
              {editingShop ? '完成' : '编辑'}
            </button>
          </div>
        </div>

        {editingShop ? (
          <div className="coin-shop-edit-list">
            {shopItems.map(item => (
              <div key={item.id} className="coin-shop-edit-row">
                <div className="coin-shop-edit-main">
                  <input
                    className="coin-shop-input coin-shop-input-icon"
                    value={item.icon}
                    maxLength={2}
                    onChange={e => updateShopItem(item.id, { icon: e.target.value })}
                  />
                  <input
                    className="coin-shop-input coin-shop-input-name"
                    value={item.name}
                    onChange={e => updateShopItem(item.id, { name: e.target.value })}
                    placeholder="商品名称"
                  />
                  <input
                    className="coin-shop-input coin-shop-input-cost"
                    type="number"
                    min={0}
                    value={item.cost}
                    onChange={e => updateShopItem(item.id, { cost: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </div>
                <input
                  className="coin-shop-input coin-shop-input-desc"
                  value={item.desc}
                  onChange={e => updateShopItem(item.id, { desc: e.target.value })}
                  placeholder="商品描述"
                />
                <div className="coin-shop-edit-footer">
                  <select
                    className="coin-shop-select"
                    value={item.effect}
                    onChange={e => updateShopItem(item.id, { effect: e.target.value as ShopEffect })}
                  >
                    {SHOP_EFFECT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <label className="coin-shop-enable">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={e => updateShopItem(item.id, { enabled: e.target.checked })}
                    />
                    上架
                  </label>
                  <button className="coin-shop-delete" onClick={() => deleteShopItem(item.id)}>删除</button>
                </div>
              </div>
            ))}
            <div className="coin-shop-edit-actions">
              <button className="coin-shop-add" onClick={handleAddShopItem}>+ 新增商品</button>
              <button className="coin-shop-reset" onClick={resetShopItems}>恢复默认</button>
            </div>
          </div>
        ) : (
          <div className="coin-shop-list">
            {shopItems.filter(item => item.enabled).map(item => {
              const isDoubleActive = item.effect === 'coinDouble' && userProfile.pendingCoinDouble;
              const disabled = userProfile.coins < item.cost || isDoubleActive;
              return (
                <button
                  key={item.id}
                  className={`coin-shop-btn ${disabled ? 'disabled' : ''}`}
                  onClick={() => handleBuy(item.id)}
                  disabled={disabled}
                >
                  <div className="coin-shop-info">
                    <span className="coin-shop-name">{item.icon} {item.name}{isDoubleActive ? ' (生效中)' : ''}</span>
                    <span className="coin-shop-desc">{item.desc}</span>
                  </div>
                  <span className="coin-shop-cost"><IconCoins size={14} color="#ffd93d" /> {item.cost}</span>
                </button>
              );
            })}
            {shopItems.filter(item => item.enabled).length === 0 && (
              <div className="coin-shop-empty">商店暂未上架商品，点击右上角「编辑」添加</div>
            )}
          </div>
        )}

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

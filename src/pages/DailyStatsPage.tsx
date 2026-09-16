import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getLevelByPoints, getLevelProgress } from '../utils/gamification';
import { getTodayStr, daysBetween } from '../utils/id';
import { IconChart, IconFlame, IconStar, IconCheck, IconTrophy } from '../components/common/Icons';
import './DailyStatsPage.css';

// 一周天数名称
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
// 一周颜色
const WEEKDAY_COLORS = ['#e17055', '#0984e3', '#6c5ce7', '#00b894', '#fdcb6e', '#e84393', '#a29bfe'];

export default function DailyStatsPage() {
  const { tasks, userProfile, dailyRecords, userBadges } = useStore();

  const todayStr = getTodayStr();
  const todayRecord = dailyRecords.find(r => r.date === todayStr);

  // 今日任务统计
  const todayTasks = useMemo(() => {
    return tasks.filter(t => !t.parentId && !t.archived);
  }, [tasks]);

  const todayDone = todayTasks.filter(t => t.status === 'done').length;
  const todayDoing = todayTasks.filter(t => t.status === 'doing').length;
  const todayTodo = todayTasks.filter(t => t.status === 'todo').length;

  // 最近7天记录
  const last7Days = useMemo(() => {
    const days: { date: string; weekday: number; label: string; count: number; points: number; isToday: boolean }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      const record = dailyRecords.find(r => r.date === dateStr);
      days.push({
        date: dateStr,
        weekday: d.getDay(),
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        count: record?.completedCount || 0,
        points: record?.pointsEarned || 0,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [dailyRecords, todayStr]);

  // 本周总计
  const weekTotal = last7Days.reduce((sum, d) => sum + d.count, 0);
  const weekPoints = last7Days.reduce((sum, d) => sum + d.points, 0);
  const avgPerDay = weekTotal > 0 ? Math.round(weekTotal / 7 * 10) / 10 : 0;

  // 最大值用于柱状图缩放
  const maxCount = Math.max(...last7Days.map(d => d.count), 1);

  // 今日完成的任务列表
  const completedToday = useMemo(() => {
    return tasks
      .filter(t => !t.parentId && t.status === 'done' && t.completedAt)
      .filter(t => {
        const completedDate = t.completedAt!.substring(0, 10);
        return completedDate === todayStr;
      })
      .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
  }, [tasks, todayStr]);

  // 等级信息
  const levelInfo = getLevelProgress(userProfile.totalPoints);

  // 完成率
  const completionRate = todayTasks.length > 0 ? Math.round((todayDone / todayTasks.length) * 100) : 0;

  // 连续打卡天数
  const streak = userProfile.currentStreak;

  // 徽章数量
  const badgeCount = userBadges.length;

  return (
    <div className="page daily-stats-page">
      {/* 页面标题 */}
      <div className="stats-page-header">
        <div className="stats-page-icon">
          <IconChart size={22} color="#fff" />
        </div>
        <h1 className="stats-page-title">每日统计</h1>
      </div>

      {/* 今日概览卡片 */}
      <div className="stats-overview-card">
        <div className="stats-overview-date">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</div>
        <div className="stats-overview-grid">
          <div className="stats-overview-item">
            <span className="stats-overview-num">{todayDone}</span>
            <span className="stats-overview-label">今日完成</span>
          </div>
          <div className="stats-overview-divider" />
          <div className="stats-overview-item">
            <span className="stats-overview-num">{todayTasks.length}</span>
            <span className="stats-overview-label">总任务数</span>
          </div>
          <div className="stats-overview-divider" />
          <div className="stats-overview-item">
            <span className="stats-overview-num">{completionRate}%</span>
            <span className="stats-overview-label">完成率</span>
          </div>
        </div>

        {/* 完成进度条 */}
        <div className="stats-progress-bar">
          <div className="stats-progress-track">
            <div className="stats-progress-fill" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        {/* 状态分布 */}
        <div className="stats-status-row">
          <span className="stats-status-tag done">已完成 {todayDone}</span>
          <span className="stats-status-tag doing">进行中 {todayDoing}</span>
          <span className="stats-status-tag todo">待办 {todayTodo}</span>
        </div>
      </div>

      {/* 本周柱状图 */}
      <div className="card stats-chart-card">
        <div className="stats-card-header">
          <h3>本周完成趋势</h3>
          <span className="stats-card-subtitle">共 {weekTotal} 个任务</span>
        </div>
        <div className="stats-bar-chart">
          {last7Days.map((day, i) => {
            const heightPercent = (day.count / maxCount) * 100;
            return (
              <div key={i} className={`stats-bar-col ${day.isToday ? 'today' : ''}`}>
                <div className="stats-bar-count">{day.count > 0 ? day.count : ''}</div>
                <div className="stats-bar-wrapper">
                  <div
                    className="stats-bar-fill"
                    style={{
                      height: `${Math.max(heightPercent, 3)}%`,
                      backgroundColor: day.count > 0 ? WEEKDAY_COLORS[day.weekday] : 'var(--color-border)',
                    }}
                  />
                </div>
                <span className="stats-bar-label">{day.label}</span>
                <span className="stats-bar-weekday">周{WEEKDAY_NAMES[day.weekday]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 数据卡片网格 */}
      <div className="stats-mini-grid">
        <div className="card stats-mini-card">
          <IconFlame size={24} color="#e84393" />
          <span className="stats-mini-num">{streak}</span>
          <span className="stats-mini-label">连续天数</span>
        </div>
        <div className="card stats-mini-card">
          <IconStar size={24} color="#fdcb6e" />
          <span className="stats-mini-num">{todayRecord?.pointsEarned || 0}</span>
          <span className="stats-mini-label">今日经验</span>
        </div>
        <div className="card stats-mini-card">
          <IconCheck size={24} color="#00b894" />
          <span className="stats-mini-num">{avgPerDay}</span>
          <span className="stats-mini-label">日均完成</span>
        </div>
        <div className="card stats-mini-card">
          <IconTrophy size={24} color="#6c5ce7" />
          <span className="stats-mini-num">{badgeCount}</span>
          <span className="stats-mini-label">已获徽章</span>
        </div>
      </div>

      {/* 等级进度 */}
      <div className="card stats-level-card">
        <div className="stats-level-header">
          <span className="stats-level-name">Lv.{levelInfo.level} {levelInfo.name}</span>
          <span className="stats-level-points">{userProfile.totalPoints} 总经验</span>
        </div>
        <div className="stats-level-bar">
          <div className="stats-level-track">
            <div className="stats-level-fill" style={{ width: `${levelInfo.progress}%` }} />
          </div>
          {levelInfo.pointsToNext !== null && (
            <span className="stats-level-hint">距下一级还需 {levelInfo.pointsToNext} 经验</span>
          )}
        </div>
      </div>

      {/* 今日完成任务列表 */}
      <div className="card stats-tasks-card">
        <div className="stats-card-header">
          <h3>今日完成记录</h3>
          <span className="stats-card-subtitle">{completedToday.length} 个任务</span>
        </div>
        {completedToday.length > 0 ? (
          <div className="stats-task-list">
            {completedToday.map(task => (
              <div key={task.id} className="stats-task-item">
                <span className="stats-task-dot" style={{
                  background: task.priority === 'high' ? '#e84393' : task.priority === 'medium' ? '#fdcb6e' : '#00b894'
                }} />
                <span className="stats-task-title">{task.title}</span>
                {task.repeat !== 'none' && (
                  <span className="stats-task-repeat">第{task.repeatCount}次</span>
                )}
                <span className="stats-task-time">
                  {task.completedAt ? new Date(task.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="stats-empty">
            <p>今天还没完成任务，开始你的第一个任务吧！</p>
          </div>
        )}
      </div>
    </div>
  );
}

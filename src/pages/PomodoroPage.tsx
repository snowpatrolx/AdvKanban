import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { useToastStore } from '../components/common/Toast';
import { getLevelByPoints, updateDailyRecord } from '../utils/gamification';
import { getTodayStr } from '../utils/id';
import { IconRefresh, IconClock, IconStar } from '../components/common/Icons';
import './PomodoroPage.css';

// ===== 番茄钟配置 =====
const FOCUS_DURATION = 25 * 60; // 25 分钟工作
const BREAK_DURATION = 5 * 60;  // 5 分钟休息
const POMODORO_REWARD = 5;      // 完成一个番茄钟奖励的经验值
const STORAGE_KEY = 'pomodoro-records'; // localStorage 存储键

type Mode = 'focus' | 'break';

interface PomodoroSession {
  taskId: string | null;
  taskTitle: string | null;
  completedAt: string;
}

interface PomodoroRecord {
  date: string;            // YYYY-MM-DD
  count: number;           // 今日完成番茄钟数
  sessions: PomodoroSession[];
}

/** 从 localStorage 读取今日记录，跨天自动重置 */
function loadRecord(): PomodoroRecord {
  const today = getTodayStr();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as PomodoroRecord;
      if (data.date === today) return data;
    }
  } catch {
    // 解析失败则使用默认记录
  }
  return { date: today, count: 0, sessions: [] };
}

/** 保存今日记录到 localStorage */
function saveRecord(record: PomodoroRecord) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // 存储失败静默处理
  }
}

export default function PomodoroPage() {
  const tasks = useStore(s => s.tasks);
  const addToast = useToastStore(s => s.addToast);

  const [mode, setMode] = useState<Mode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [record, setRecord] = useState<PomodoroRecord>(loadRecord);

  const intervalRef = useRef<number | null>(null);
  const completedRef = useRef(false); // 防止完成逻辑重复触发

  const totalDuration = mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;

  // 可选关联的任务：未完成的主任务
  const activeTasks = tasks.filter(t => !t.parentId && t.status !== 'done');
  const selectedTask = activeTasks.find(t => t.id === selectedTaskId) || null;

  // ===== 倒计时核心逻辑 =====
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, mode]);

  // ===== 完成一个阶段（工作或休息）的奖励与切换 =====
  const handleComplete = useCallback(() => {
    setIsRunning(false);

    if (mode === 'focus') {
      // 记录今日番茄钟
      const newRecord: PomodoroRecord = {
        ...record,
        count: record.count + 1,
        sessions: [
          ...record.sessions,
          {
            taskId: selectedTaskId || null,
            taskTitle: selectedTask?.title || null,
            completedAt: new Date().toISOString(),
          },
        ],
      };
      setRecord(newRecord);
      saveRecord(newRecord);

      // 调用 store 方法发放积分奖励（不修改 useStore.ts，使用 Zustand setState）
      const state = useStore.getState();
      const newPoints = state.userProfile.totalPoints + POMODORO_REWARD;
      const newLevel = getLevelByPoints(newPoints).level;
      const todayStr = getTodayStr();
      const newDailyRecords = updateDailyRecord(state.dailyRecords, todayStr, POMODORO_REWARD);
      useStore.setState({
        userProfile: {
          ...state.userProfile,
          totalPoints: newPoints,
          level: newLevel,
        },
        dailyRecords: newDailyRecords,
      });

      addToast({
        icon: '★',
        title: `番茄钟完成！+${POMODORO_REWARD} 经验值`,
        subtitle: selectedTask ? `关联任务：${selectedTask.title}` : undefined,
      });

      // 自动进入休息阶段
      setMode('break');
      setSecondsLeft(BREAK_DURATION);
    } else {
      addToast({ icon: '✓', title: '休息结束，继续专注吧！' });
      setMode('focus');
      setSecondsLeft(FOCUS_DURATION);
    }
  }, [mode, record, selectedTaskId, selectedTask, addToast]);

  // 倒计时归零时触发完成
  useEffect(() => {
    if (secondsLeft === 0 && isRunning && !completedRef.current) {
      completedRef.current = true;
      handleComplete();
    }
  }, [secondsLeft, isRunning, handleComplete]);

  // ===== 控制按钮 =====
  const handleToggle = () => {
    completedRef.current = false;
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    completedRef.current = false;
    setSecondsLeft(mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION);
  };

  // ===== 时间显示 =====
  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeText = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // ===== 圆形进度（SVG） =====
  const radius = 130;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const remainingRatio = secondsLeft / totalDuration;
  const dashOffset = circumference * (1 - remainingRatio);

  // 状态文字
  const statusText = mode === 'focus'
    ? (isRunning ? '专注中' : '准备专注')
    : (isRunning ? '休息中' : '休息时间');

  // 今日专注总时长（分钟）
  const focusMinutes = record.count * 25;

  // 最近完成的会话（倒序，最多 5 条）
  const recentSessions = [...record.sessions].reverse().slice(0, 5);

  return (
    <div className="page pomodoro-page">
      {/* 页面标题 */}
      <div className="pomodoro-page-header">
        <div className="pomodoro-page-icon">
          <IconClock size={22} color="#fff" />
        </div>
        <h1 className="pomodoro-page-title">番茄钟</h1>
      </div>

      {/* 圆形倒计时 */}
      <div className={`pomodoro-timer-card pomodoro-mode-${mode}`}>
        <div className="pomodoro-timer-ring">
          <svg
            className="pomodoro-svg"
            width="300"
            height="300"
            viewBox="0 0 300 300"
          >
            {/* 背景圆环 */}
            <circle
              className="pomodoro-ring-track"
              cx="150"
              cy="150"
              r={radius}
              fill="none"
              strokeWidth={stroke}
            />
            {/* 进度圆环 */}
            <circle
              className="pomodoro-ring-progress"
              cx="150"
              cy="150"
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="pomodoro-timer-center">
            <span className="pomodoro-time-text">{timeText}</span>
            <span className="pomodoro-status-text">{statusText}</span>
          </div>
        </div>

        {/* 模式标签 */}
        <div className="pomodoro-mode-tags">
          <span className={`pomodoro-mode-tag ${mode === 'focus' ? 'active' : ''}`}>
            专注 25:00
          </span>
          <span className={`pomodoro-mode-tag ${mode === 'break' ? 'active' : ''}`}>
            休息 05:00
          </span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="pomodoro-controls">
        <button
          className="btn btn-secondary pomodoro-btn-reset"
          onClick={handleReset}
          aria-label="重置"
        >
          <IconRefresh size={20} color="var(--color-text-secondary)" />
          重置
        </button>
        <button
          className={`btn pomodoro-btn-toggle ${isRunning ? 'pause' : 'start'}`}
          onClick={handleToggle}
        >
          {isRunning ? '暂停' : '开始'}
        </button>
        <div className="pomodoro-btn-placeholder" aria-hidden="true" />
      </div>

      {/* 关联任务 */}
      <div className="card pomodoro-task-card">
        <label className="form-label pomodoro-task-label">
          <IconStar size={14} color="var(--color-primary)" /> 关联任务（可选）
        </label>
        <select
          className="form-select pomodoro-task-select"
          value={selectedTaskId}
          onChange={e => setSelectedTaskId(e.target.value)}
        >
          <option value="">不关联任务</option>
          {activeTasks.map(task => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
        {activeTasks.length === 0 && (
          <p className="pomodoro-task-empty">暂无可关联的任务，先去创建一个吧</p>
        )}
      </div>

      {/* 今日统计 */}
      <div className="card pomodoro-stats-card">
        <div className="pomodoro-stats-header">
          <h3>今日统计</h3>
          <span className="pomodoro-stats-date">{record.date}</span>
        </div>
        <div className="pomodoro-stats-grid">
          <div className="pomodoro-stat-item">
            <span className="pomodoro-stat-num">{record.count}</span>
            <span className="pomodoro-stat-label">完成番茄钟</span>
          </div>
          <div className="pomodoro-stat-item">
            <span className="pomodoro-stat-num">{focusMinutes}</span>
            <span className="pomodoro-stat-label">专注分钟</span>
          </div>
          <div className="pomodoro-stat-item">
            <span className="pomodoro-stat-num">+{record.count * POMODORO_REWARD}</span>
            <span className="pomodoro-stat-label">获得经验</span>
          </div>
        </div>

        {/* 最近会话记录 */}
        {recentSessions.length > 0 && (
          <div className="pomodoro-sessions">
            <p className="pomodoro-sessions-title">最近记录</p>
            {recentSessions.map((session, idx) => (
              <div key={idx} className="pomodoro-session-item">
                <span className="pomodoro-session-dot" />
                <span className="pomodoro-session-task">
                  {session.taskTitle || '自由专注'}
                </span>
                <span className="pomodoro-session-time">
                  {new Date(session.completedAt).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getLevelProgress, LEVELS } from '../utils/gamification';
import { CHAPTERS } from '../data/chapters';
import { BADGES } from '../data/badges';
import { IconAI, IconSend, IconUser } from '../components/common/Icons';
import './AIAnalysisPage.css';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export default function AIAnalysisPage() {
  const { tasks, categories, knowledge, userProfile, userBadges, storyProgress, dailyRecords } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 初始欢迎消息
    setMessages([{
      role: 'ai',
      content: '你好！我是你的效率分析助手。我可以帮你分析任务进度、连续打卡情况、冒险故事进展等。试试问我：「我最近表现怎么样？」或「给我一些任务管理建议」。',
    }]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const generateAnalysis = (question: string): string => {
    const levelInfo = getLevelProgress(userProfile.totalPoints);
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayRecords = dailyRecords.find(r => r.date === todayStr);
    const pendingTasks = tasks.filter(t => t.status !== 'done');
    const overdueTasks = tasks.filter(t => t.status !== 'done' && t.dueDate && t.dueDate < todayStr);
    const doingTasks = tasks.filter(t => t.status === 'doing');
    const currentChapter = CHAPTERS.find(c => c.id === storyProgress.currentChapter);
    const earnedBadges = BADGES.filter(b => userBadges.includes(b.id));

    const q = question.toLowerCase();

    // 表现/进度分析
    if (q.includes('表现') || q.includes('怎么样') || q.includes('进度') || q.includes('分析')) {
      let analysis = `📊 当前进度分析：\n\n`;
      analysis += `【等级与积分】\n当前等级 Lv.${levelInfo.level} ${levelInfo.name}，累计 ${userProfile.totalPoints} 经验值`;
      if (levelInfo.pointsToNext !== null) {
        analysis += `，距离下一级还需 ${levelInfo.pointsToNext} 经验。\n`;
      } else {
        analysis += `，已达最高等级！\n`;
      }

      analysis += `\n【任务情况】\n`;
      analysis += `- 待办任务：${pendingTasks.length} 个\n`;
      analysis += `- 进行中：${doingTasks.length} 个\n`;
      analysis += `- 已完成：${userProfile.completedTaskCount} 个\n`;
      if (overdueTasks.length > 0) {
        analysis += `- ⚠️ 已逾期：${overdueTasks.length} 个，建议优先处理\n`;
      }

      analysis += `\n【连续打卡】\n当前连续 ${userProfile.currentStreak} 天完成任务，最长记录 ${userProfile.longestStreak} 天。`;
      if (userProfile.currentStreak === 0) {
        analysis += `\n今天还没有完成任务哦，完成一个任务开启连胜吧！\n`;
      } else if (userProfile.currentStreak >= 7) {
        analysis += `\n连续一周以上，坚持得非常好！\n`;
      } else {
        analysis += `\n继续加油，保持连胜！\n`;
      }

      if (todayRecords) {
        analysis += `\n【今日数据】\n今天已完成 ${todayRecords.completedCount} 个任务，获得 ${todayRecords.pointsEarned} 经验值。\n`;
      }

      analysis += `\n【知识库】\n已积累 ${knowledge.length} 条知识，`;
      if (knowledge.length >= 10) {
        analysis += `知识储备丰富！\n`;
      } else {
        analysis += `可以多记录一些学习心得。\n`;
      }

      analysis += `\n【冒险进度】\n当前在第 ${storyProgress.currentChapter} 章「${currentChapter?.title}」`;
      if (currentChapter?.bossName) {
        const bossHP = storyProgress.bossCurrentHP[currentChapter.id] ?? currentChapter.bossHP;
        analysis += `，Boss「${currentChapter.bossName}」剩余 HP: ${bossHP}/${currentChapter.bossHP}`;
      }
      analysis += `。已解锁 ${storyProgress.unlockedChapters.length}/${CHAPTERS.length} 章节。\n`;

      analysis += `\n【徽章】\n已获得 ${earnedBadges.length}/${BADGES.length} 枚徽章。`;

      return analysis;
    }

    // 建议
    if (q.includes('建议') || q.includes('推荐') || q.includes('怎么') || q.includes('如何')) {
      let advice = `💡 个性化建议：\n\n`;

      if (overdueTasks.length > 0) {
        advice += `1. 你有 ${overdueTasks.length} 个逾期任务，建议优先处理：\n`;
        overdueTasks.slice(0, 3).forEach(t => {
          advice += `   - ${t.title}\n`;
        });
        advice += `\n`;
      }

      if (userProfile.currentStreak === 0) {
        advice += `2. 今天还没有完成任务，建议选择一个小任务先完成，开启连胜模式。\n\n`;
      } else if (userProfile.currentStreak < 3) {
        advice += `2. 当前连续 ${userProfile.currentStreak} 天，再坚持 ${3 - userProfile.currentStreak} 天就能获得「连续三天」徽章！\n\n`;
      }

      const highPriorityPending = pendingTasks.filter(t => t.priority === 'high');
      if (highPriorityPending.length > 0) {
        advice += `3. 有 ${highPriorityPending.length} 个高优先级任务待完成，完成后可获得双倍经验（+20）。\n\n`;
      }

      if (knowledge.length < 5) {
        advice += `4. 知识库内容较少，创建知识条目可获得 +5 经验值，还能推进冒险故事第4章。\n\n`;
      }

      if (doingTasks.length > 3) {
        advice += `5. 进行中任务较多（${doingTasks.length}个），建议聚焦完成，避免分散注意力。\n\n`;
      }

      const taskByCategory = categories.map(c => ({
        name: c.name,
        count: tasks.filter(t => t.categoryId === c.id && t.status !== 'done').length,
      }));
      const busyCategory = taskByCategory.sort((a, b) => b.count - a.count)[0];
      if (busyCategory && busyCategory.count > 0) {
        advice += `6. 「${busyCategory.name}」分类下有最多待办（${busyCategory.count}个），可以集中处理。\n\n`;
      }

      if (currentChapter?.bossName) {
        const bossHP = storyProgress.bossCurrentHP[currentChapter.id] ?? currentChapter.bossHP;
        const attacksNeeded = Math.ceil(bossHP / 15);
        advice += `7. 当前 Boss「${currentChapter.bossName}」剩余 ${bossHP} HP，大约还需完成 ${attacksNeeded} 个任务即可击败。\n\n`;
      }

      if (advice === `💡 个性化建议：\n\n`) {
        advice += `一切看起来都不错！继续保持，完成任务和记录知识来推进你的冒险之旅吧！`;
      }

      return advice;
    }

    // 冒险相关
    if (q.includes('冒险') || q.includes('boss') || q.includes('故事') || q.includes('章节')) {
      let story = `🗺️ 冒险故事分析：\n\n`;
      story += `当前章节：第 ${storyProgress.currentChapter} 章「${currentChapter?.title}」\n`;
      story += `所在区域：${currentChapter?.area}\n`;
      story += `已解锁章节：${storyProgress.unlockedChapters.length}/${CHAPTERS.length}\n`;
      story += `已击败 Boss：${storyProgress.defeatedBosses.length} 个\n\n`;

      if (currentChapter?.bossName) {
        const bossHP = storyProgress.bossCurrentHP[currentChapter.id] ?? currentChapter.bossHP;
        const progress = ((currentChapter.bossHP - bossHP) / currentChapter.bossHP * 100).toFixed(0);
        story += `当前 Boss：${currentChapter.bossName}\n`;
        story += `HP 进度：${bossHP}/${currentChapter.bossHP}（已造成 ${progress}% 伤害）\n`;
        story += `每完成一个任务 = 一次攻击，伤害等于任务获得的经验值\n`;
        const attacksNeeded = Math.ceil(bossHP / 15);
        story += `预计还需约 ${attacksNeeded} 个任务可击败 Boss\n\n`;
      }

      story += `章节列表：\n`;
      CHAPTERS.forEach(c => {
        const unlocked = storyProgress.unlockedChapters.includes(c.id);
        const defeated = storyProgress.defeatedBosses.includes(c.id);
        const status = defeated ? '✓ 已通关' : unlocked ? '○ 当前' : '🔒 未解锁';
        story += `${status}  第${c.id}章 ${c.title} - ${c.area}\n`;
      });

      return story;
    }

    // 徽章相关
    if (q.includes('徽章') || q.includes('成就')) {
      let badgeInfo = `🏆 徽章进度：\n\n`;
      badgeInfo += `已获得 ${earnedBadges.length}/${BADGES.length} 枚徽章\n\n`;
      BADGES.forEach(b => {
        const earned = userBadges.includes(b.id);
        badgeInfo += `${earned ? '✓' : '○'} ${b.icon} ${b.name} - ${b.description}\n`;
      });
      const locked = BADGES.filter(b => !userBadges.includes(b.id));
      if (locked.length > 0) {
        badgeInfo += `\n还未获得的徽章中，`;
        const next = locked[0];
        badgeInfo += `「${next.name}」可能是最容易获得的：${next.description}`;
      }
      return badgeInfo;
    }

    // 知识库
    if (q.includes('知识') || q.includes('学习')) {
      let knowledgeInfo = `📖 知识库分析：\n\n`;
      knowledgeInfo += `共有 ${knowledge.length} 条知识\n\n`;
      const byCategory = categories.map(c => ({
        name: c.name,
        count: knowledge.filter(k => k.categoryId === c.id).length,
      }));
      byCategory.forEach(c => {
        knowledgeInfo += `${c.name}：${c.count} 条\n`;
      });
      knowledgeInfo += `\n创建知识条目可获得 +5 经验值，创建5条可推进冒险故事第4章。`;
      return knowledgeInfo;
    }

    // 默认回复
    return `我理解你的问题。你可以问我：\n\n- 「我最近表现怎么样？」- 查看整体进度分析\n- 「给我一些建议」- 获取个性化任务管理建议\n- 「冒险故事进度」- 查看冒险章节和Boss状态\n- 「徽章进度」- 查看成就解锁情况\n- 「知识库分析」- 查看知识积累情况\n\n当前你有 ${pendingTasks.length} 个待办任务，等级 Lv.${levelInfo.level}，连续 ${userProfile.currentStreak} 天完成任务。`;
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    // 模拟 AI 思考延迟
    setTimeout(() => {
      const analysis = generateAnalysis(userMsg);
      setMessages(prev => [...prev, { role: 'ai', content: analysis }]);
      setLoading(false);
    }, 600);
  };

  const quickQuestions = [
    '我最近表现怎么样？',
    '给我一些建议',
    '冒险故事进度',
    '徽章进度',
  ];

  return (
    <div className="page ai-page">
      <div className="ai-header">
        <div className="ai-header-icon">
          <IconAI size={24} color="#fff" />
        </div>
        <div>
          <h1 className="ai-title">AI 进度分析</h1>
          <p className="ai-subtitle">对话式解读你的任务与冒险进度</p>
        </div>
      </div>

      <div className="ai-chat-area" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ${msg.role}`}>
            <div className="ai-message-avatar">
              {msg.role === 'ai' ? (
                <IconAI size={18} color="#fff" />
              ) : (
                <IconUser size={18} color="#fff" />
              )}
            </div>
            <div className="ai-message-bubble">
              <pre className="ai-message-text">{msg.content}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-message ai">
            <div className="ai-message-avatar">
              <IconAI size={18} color="#fff" />
            </div>
            <div className="ai-message-bubble ai-typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="ai-quick-questions">
          {quickQuestions.map(q => (
            <button key={q} className="ai-quick-btn" onClick={() => { setInput(q); }}>
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="ai-input-area">
        <input
          className="ai-input"
          placeholder="输入你的问题..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <button className="ai-send-btn" onClick={handleSend} disabled={!input.trim() || loading}>
          <IconSend size={20} color="#fff" />
        </button>
      </div>
    </div>
  );
}

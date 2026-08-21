/**
 * AI 文本总结与分析工具
 * 基于启发式算法的前端文本分析，模拟 AI 总结效果
 */

interface SummaryResult {
  summary: string;           // 简短摘要
  keyPoints: string[];       // 要点列表
  keywords: { word: string; count: number }[];  // 关键词
  actionItems: string[];     // 行动项
  structure: string;         // 结构化整理
}

// 中文停用词
const STOP_WORDS = new Set([
  '的', '了', '是', '在', '和', '与', '或', '一个', '可以', '使用', '通过',
  '进行', '这个', '那个', '什么', '怎么', '为什么', '因为', '所以', '但是',
  '如果', '然后', '还有', '就是', '都', '也', '就', '很', '更', '最',
  '不', '没', '有', '我', '你', '他', '她', '它', '我们', '你们', '他们',
  '这', '那', '哪', '些', '这样', '那样', '如何', '以及', '等等', '比如',
  '例如', '大概', '可能', '应该', '需要', '能够', '已经', '正在', '将要',
  '会', '能', '要', '得', '着', '过', '被', '把', '让', '给', '向',
  '从', '到', '对', '为', '以', '于', '上', '下', '中', '里', '外',
  '前', '后', '左', '右', '内', '外', '间', '旁', '边',
  '是', '有', '在', '做', '说', '看', '听', '想', '知', '道',
  'the', 'a', 'an', 'to', 'is', 'in', 'for', 'of', 'and', 'or',
  'that', 'this', 'it', 'you', 'i', 'he', 'she', 'we', 'they',
  'with', 'on', 'at', 'by', 'from', 'as', 'but', 'not', 'are',
  'be', 'have', 'has', 'had', 'was', 'were', 'will', 'would',
  'can', 'could', 'should', 'may', 'might', 'must',
  'very', 'more', 'most', 'so', 'too', 'also',
]);

// 行动项关键词
const ACTION_KEYWORDS = [
  '应该', '需要', '必须', '要', '记得', '注意', '务必', '确保',
  '开始', '完成', '创建', '设置', '配置', '安装', '学习', '练习',
  '记录', '整理', '总结', '复习', '准备', '计划', '安排',
  'TODO', 'todo', '待办', '行动', '下一步', '接下来',
];

/**
 * 提取关键词
 */
function extractKeywords(text: string, topN = 10): { word: string; count: number }[] {
  const cleaned = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ');

  // 提取中文词汇（2-4字组合）和英文单词
  const words: string[] = [];

  // 英文单词
  const englishWords = cleaned.match(/[a-zA-Z]{3,}/g) || [];
  words.push(...englishWords.map(w => w.toLowerCase()));

  // 中文2字词组（简单分词）
  const chineseChars = cleaned.replace(/[^\u4e00-\u9fa5]/g, '');
  for (let i = 0; i < chineseChars.length - 1; i++) {
    const twoChar = chineseChars.substring(i, i + 2);
    if (!STOP_WORDS.has(twoChar)) {
      words.push(twoChar);
    }
  }

  // 统计词频
  const freq: Record<string, number> = {};
  words.forEach(w => {
    if (w.length >= 2 && !STOP_WORDS.has(w.toLowerCase())) {
      freq[w] = (freq[w] || 0) + 1;
    }
  });

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
}

/**
 * 分句
 */
function splitSentences(text: string): string[] {
  const sentences = text
    .split(/[。！？!?\n;；]/)
    .map(s => s.trim())
    .filter(s => s.length >= 4);
  return sentences;
}

/**
 * 提取要点句子
 */
function extractKeySentences(text: string, count = 5): string[] {
  const sentences = splitSentences(text);
  if (sentences.length <= count) return sentences;

  const keywords = extractKeywords(text, 15);
  const keywordSet = new Set(keywords.map(k => k.word));

  // 计算每个句子的重要性分数
  const scored = sentences.map(sentence => {
    let score = 0;
    // 关键词匹配
    keywordSet.forEach(kw => {
      if (sentence.includes(kw)) score += 2;
    });
    // 位置加分（首句和结尾句更重要）
    if (sentences.indexOf(sentence) === 0) score += 3;
    if (sentences.indexOf(sentence) === sentences.length - 1) score += 2;
    // 长度适中的句子更可能是要点
    if (sentence.length > 20 && sentence.length < 80) score += 1;
    // 包含数字的句子更重要
    if (/\d/.test(sentence)) score += 1;

    return { sentence, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(s => s.sentence);
}

/**
 * 提取行动项
 */
function extractActionItems(text: string): string[] {
  const sentences = splitSentences(text);
  const actionItems: string[] = [];

  sentences.forEach(s => {
    const isAction = ACTION_KEYWORDS.some(kw =>
      s.includes(kw) && s.length < 100
    );
    if (isAction) {
      actionItems.push(s);
    }
  });

  return actionItems.slice(0, 6);
}

/**
 * 生成摘要
 */
function generateSummary(text: string, keywords: { word: string; count: number }[]): string {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return '';
  if (sentences.length <= 2) return sentences.join('。');

  const keywordSet = new Set(keywords.slice(0, 8).map(k => k.word));

  // 找最有代表性的句子
  let bestSentence = sentences[0];
  let bestScore = 0;

  sentences.forEach(s => {
    let score = 0;
    keywordSet.forEach(kw => {
      if (s.includes(kw)) score++;
    });
    if (s.length > 15 && s.length < 60) score += 1;
    if (score > bestScore) {
      bestScore = score;
      bestSentence = s;
    }
  });

  // 生成摘要
  const topKeywords = keywords.slice(0, 3).map(k => k.word).join('、');
  if (sentences.length > 3) {
    return `本文围绕${topKeywords}等主题展开，共${sentences.length}个要点。核心观点：${bestSentence}。`;
  }
  return bestSentence;
}

/**
 * 生成结构化整理
 */
function generateStructure(text: string, keyPoints: string[]): string {
  const keywords = extractKeywords(text, 5);
  const topKeyword = keywords[0]?.word || '主题';

  let structure = `【${topKeyword}】整理\n\n`;
  structure += `一、核心内容\n`;
  keyPoints.slice(0, 3).forEach((p, i) => {
    structure += `  ${i + 1}. ${p}\n`;
  });

  const actionItems = extractActionItems(text);
  if (actionItems.length > 0) {
    structure += `\n二、行动清单\n`;
    actionItems.slice(0, 5).forEach((item, i) => {
      structure += `  ☐ ${item}\n`;
    });
  }

  if (keyPoints.length > 3) {
    structure += `\n三、补充要点\n`;
    keyPoints.slice(3).forEach((p, i) => {
      structure += `  • ${p}\n`;
    });
  }

  if (keywords.length > 0) {
    structure += `\n四、关键词\n  `;
    structure += keywords.slice(0, 8).map(k => `#${k.word}`).join(' ');
  }

  return structure;
}

/**
 * 视频文案生成
 * 基于视频标题和用户笔记，生成结构化的视频文案/笔记
 */
export function generateVideoNote(title: string, rawNote: string, platform: string): string {
  const text = (title + ' ' + rawNote).trim();
  const keywords = extractKeywords(text, 8);
  const keyPoints = extractKeySentences(rawNote || title, 5);
  const actionItems = extractActionItems(rawNote);

  let result = '';

  // 标题
  result += `📹 ${title || '视频笔记'}\n`;
  result += `平台：${platform}\n`;
  result += `整理时间：${new Date().toLocaleDateString('zh-CN')}\n\n`;

  // 核心观点
  result += `━━━ 核心观点 ━━━\n`;
  if (keyPoints.length > 0) {
    keyPoints.slice(0, 3).forEach((p, i) => {
      result += `${i + 1}. ${p}\n`;
    });
  } else {
    result += `（请在上方填写视频笔记内容后再生成）\n`;
  }
  result += '\n';

  // 金句/摘录
  if (rawNote && rawNote.length > 50) {
    result += `━━━ 摘录与感悟 ━━━\n`;
    // 取较长的句子作为摘录
    const sentences = splitSentences(rawNote).filter(s => s.length > 15);
    sentences.slice(0, 3).forEach(s => {
      result += `  "${s}"\n`;
    });
    result += '\n';
  }

  // 行动项
  if (actionItems.length > 0) {
    result += `━━━ 行动清单 ━━━\n`;
    actionItems.slice(0, 5).forEach(item => {
      result += `☐ ${item}\n`;
    });
    result += '\n';
  }

  // 关键词
  if (keywords.length > 0) {
    result += `━━━ 关键词 ━━━\n`;
    result += keywords.slice(0, 6).map(k => `#${k.word}`).join('  ');
    result += '\n\n';
  }

  // 我的思考
  result += `━━━ 我的思考 ━━━\n`;
  result += `\n（在这里写下你的想法和收获...）\n`;

  return result;
}

/**
 * AI 总结知识内容
 */
export function summarizeKnowledge(title: string, content: string, videoNote?: string): SummaryResult {
  const fullText = title + ' ' + content + (videoNote ? ' ' + videoNote : '');
  const keywords = extractKeywords(fullText, 10);
  const keySentences = extractKeySentences(content + (videoNote ? ' ' + videoNote : ''), 5);
  const actionItems = extractActionItems(fullText);
  const summary = generateSummary(content, keywords);
  const structure = generateStructure(fullText, keySentences);

  return {
    summary,
    keyPoints: keySentences,
    keywords,
    actionItems,
    structure,
  };
}

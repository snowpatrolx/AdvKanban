/**
 * 网页内容抓取工具
 * 通过 CORS 代理读取网页内容并提取正文
 */

// CORS 代理列表（按顺序尝试）
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
];

interface FetchResult {
  title: string;
  content: string;
  description: string;
  error?: string;
}

/**
 * 从 HTML 中提取标题
 */
function extractTitle(doc: Document): string {
  // 优先 <meta property="og:title">
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
  if (ogTitle) return ogTitle.trim();

  // 其次 <title>
  const title = doc.querySelector('title')?.textContent;
  if (title) return title.trim();

  // 最后 <h1>
  const h1 = doc.querySelector('h1')?.textContent;
  if (h1) return h1.trim();

  return '';
}

/**
 * 从 HTML 中提取描述
 */
function extractDescription(doc: Document): string {
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
  if (ogDesc) return ogDesc.trim();

  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content');
  if (metaDesc) return metaDesc.trim();

  return '';
}

/**
 * 从 HTML 中提取正文内容
 * 策略：优先 article 标签，其次 main 标签，最后找最大的文本块
 */
function extractContent(doc: Document): string {
  // 移除不需要的元素
  const unwanted = doc.querySelectorAll('script, style, nav, header, footer, aside, iframe, noscript, form, button, input, select, textarea, svg, canvas, .ad, .ads, .advertisement, .sidebar, .comment, .comments, .related, .share, .social, .pagination, .breadcrumb');
  unwanted.forEach(el => el.remove());

  // 优先级 1: article 标签
  const article = doc.querySelector('article');
  if (article && article.textContent && article.textContent.trim().length > 100) {
    return extractParagraphs(article);
  }

  // 优先级 2: main 标签
  const main = doc.querySelector('main');
  if (main && main.textContent && main.textContent.trim().length > 100) {
    return extractParagraphs(main);
  }

  // 优先级 3: 常见文章容器 class
  const contentSelectors = [
    '.article-content', '.post-content', '.entry-content', '.article-body',
    '.post-body', '.content-body', '.article-text', '.story-body',
    '#article-content', '#post-content', '#content-body',
    '[class*="article"]', '[class*="content"]', '[class*="post-body"]',
  ];

  for (const selector of contentSelectors) {
    const el = doc.querySelector(selector);
    if (el && el.textContent && el.textContent.trim().length > 100) {
      return extractParagraphs(el);
    }
  }

  // 优先级 4: 找所有 p 标签
  const paragraphs = doc.querySelectorAll('p');
  if (paragraphs.length > 0) {
    const texts: string[] = [];
    paragraphs.forEach(p => {
      const text = p.textContent?.trim();
      if (text && text.length > 10) {
        texts.push(text);
      }
    });
    if (texts.length > 0) {
      return texts.join('\n\n');
    }
  }

  // 优先级 5: body 的全部文本（最后手段）
  const body = doc.body;
  if (body && body.textContent) {
    const text = body.textContent.trim().replace(/\s+/g, ' ').substring(0, 5000);
    return text;
  }

  return '';
}

/**
 * 从元素中提取段落文本
 */
function extractParagraphs(element: Element): string {
  const paragraphs: string[] = [];

  // 尝试找 p, div, li 等块级元素
  const blocks = element.querySelectorAll('p, div > br, li, blockquote, h2, h3, h4');

  if (blocks.length > 0) {
    blocks.forEach(block => {
      const text = block.textContent?.trim();
      if (text && text.length > 5) {
        // 避免重复
        if (!paragraphs.includes(text)) {
          paragraphs.push(text);
        }
      }
    });
  }

  if (paragraphs.length === 0) {
    // 直接取文本
    const text = element.textContent?.trim().replace(/\s+/g, ' ');
    if (text) return text.substring(0, 5000);
  }

  return paragraphs.join('\n\n');
}

/**
 * 抓取网页内容
 */
export async function fetchWebContent(url: string): Promise<FetchResult> {
  // 确保 URL 有协议
  let targetUrl = url.trim();
  if (!targetUrl.match(/^https?:\/\//)) {
    targetUrl = 'https://' + targetUrl;
  }

  let lastError = '';

  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy(targetUrl);
      const response = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        continue;
      }

      const html = await response.text();
      if (!html || html.length < 50) {
        lastError = '页面内容为空';
        continue;
      }

      // 解析 HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const title = extractTitle(doc);
      const description = extractDescription(doc);
      const content = extractContent(doc);

      if (content && content.trim().length > 20) {
        return { title, content: content.substring(0, 8000), description };
      }

      lastError = '未能提取正文内容';
    } catch (err) {
      lastError = err instanceof Error ? err.message : '请求失败';
      continue;
    }
  }

  return {
    title: '',
    content: '',
    description: '',
    error: `无法读取网页内容：${lastError}。请手动粘贴内容。`,
  };
}

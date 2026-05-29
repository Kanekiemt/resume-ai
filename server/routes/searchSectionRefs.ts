import { Request, Response } from 'express';

/** Search nowcoder for resume examples relevant to a section type */
async function searchNowcoder(query: string): Promise<{ title: string; url: string; id: string }[]> {
  const url = `https://www.nowcoder.com/search?type=post&query=${encodeURIComponent(query)}&order=default`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return [];
    const html = await response.text();
    const results: { title: string; url: string; id: string }[] = [];
    const seen = new Set<string>();
    const linkRegex = /href="(\/discuss\/\d+[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const rawTitle = match[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (rawTitle && rawTitle.length > 8 && !seen.has(href) && results.length < 5) {
        seen.add(href);
        results.push({ title: rawTitle.slice(0, 80), url: `https://www.nowcoder.com${href}`, id: href.split('/').pop() || href });
      }
    }
    return results;
  } catch {
    return [];
  }
}

/** Fetch and extract text from a nowcoder discuss page */
async function fetchPageText(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'zh-CN,zh;q=0.9' },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return '';
    const html = await response.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);
  } catch {
    return '';
  }
}

/**
 * Use AI to extract resume-writing snippets from raw page text.
 * We use a simple approach: send page text + section type to DeepSeek,
 * ask it to extract relevant resume-writing advice or examples.
 */
async function extractSnippetsWithAI(
  pageTexts: { title: string; url: string; text: string }[],
  sectionType: string,
  sectionTitle: string,
  apiKey: string
): Promise<any[]> {
  const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

  const combinedText = pageTexts
    .filter(p => p.text.length > 100)
    .slice(0, 3)
    .map((p, i) => `[来源${i + 1}] ${p.title}\n${p.url}\n${p.text.slice(0, 1500)}`)
    .join('\n\n---\n\n');

  if (!combinedText) return [];

  const prompt = `你是一个简历优化助手。请从以下牛客网帖子中，提取与「${sectionTitle}」模块相关的简历写法和优化建议。

对每个有价值的片段，提取：
1. 片段原文（保持原样，最多150字）
2. 亮点标注（这个片段好在哪里？如"量化指标""STAR结构""技术深度""业务关联"）
3. 来源标题

返回严格 JSON 数组（只输出 JSON，无其他文本）：
[
  {
    "snippet": "简历写法片段原文",
    "highlight": "亮点标注，一句话",
    "sourceTitle": "来源帖子标题",
    "sourceUrl": "https://..."
  }
]

最多返回 3 条。如果帖子内容不包含相关简历写法，返回空数组 []。

## 帖子内容：
${combinedText}`;

  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 1024,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) return [];
    const json = await response.json() as any;
    const text = json?.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

export async function searchSectionRefs(req: Request, res: Response) {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '') || process.env.DEEPSEEK_API_KEY || '';
    if (!apiKey) {
      res.status(400).json({ success: false, error: 'API Key 未设置' });
      return;
    }

    const { sectionType, sectionTitle, positionTitle, companyName } = req.body;
    if (!sectionType || !sectionTitle) {
      res.status(400).json({ success: false, error: '缺少模块信息' });
      return;
    }

    // Build search queries based on section type
    const sectionQueryMap: Record<string, string[]> = {
      work_experience: [`${positionTitle} 实习经历 简历写法`, `${positionTitle} 工作经历 简历优化`, `简历 实习 怎么写 STAR`],
      projects: [`${positionTitle} 项目经验 简历`, `项目经历 简历 STAR`, `${positionTitle} 项目 简历优化`],
      education: [`教育背景 简历写法`, `在校经历 简历优化`],
      skills: [`${positionTitle} 技能 简历`, `简历 专业技能 怎么写`, `技能列表 简历优化`],
      self_evaluation: [`自我评价 简历写法`, `简历 自我介绍 模板`, `自我评价 简历优化`],
    };

    const queries = sectionQueryMap[sectionType] || [
      `${sectionTitle} 简历写法 ${positionTitle}`,
      `简历 ${sectionTitle} 优化`,
    ];

    // Search nowcoder
    const allResults: { title: string; url: string; id: string }[] = [];
    for (const q of queries.slice(0, 3)) {
      const results = await searchNowcoder(q);
      for (const r of results) {
        if (!allResults.find(a => a.id === r.id) && allResults.length < 8) {
          allResults.push(r);
        }
      }
    }

    // Fetch page content
    const pageTexts = await Promise.all(
      allResults.slice(0, 5).map(async (r) => ({
        title: r.title,
        url: r.url,
        text: await fetchPageText(r.url),
      }))
    );

    // Use AI to extract snippets
    const snippets = await extractSnippetsWithAI(pageTexts, sectionType, sectionTitle, apiKey);

    res.json({ success: true, snippets });
  } catch (err: any) {
    console.error('[searchSectionRefs] Error:', err?.message);
    res.status(500).json({ success: false, error: err?.message || '搜索失败' });
  }
}

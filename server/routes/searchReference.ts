import { Request, Response } from 'express';

async function searchSingle(query: string): Promise<{ title: string; url: string; id: string }[]> {
  const url = `https://www.nowcoder.com/search?type=post&query=${encodeURIComponent(query)}&order=default`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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
    if (rawTitle && rawTitle.length > 5 && !seen.has(href) && results.length < 4) {
      seen.add(href);
      results.push({
        title: rawTitle.slice(0, 80),
        url: `https://www.nowcoder.com${href}`,
        id: href.split('/').pop() || href,
      });
    }
  }

  return results;
}

export async function searchReference(req: Request, res: Response) {
  try {
    const { position, company } = req.body;
    if (!position) {
      res.status(400).json({ success: false, error: '请提供岗位名称' });
      return;
    }

    // Multiple search queries in parallel for better coverage
    const queries = [
      `${position} ${company || ''} 简历 面经`,
      `${position} 求职 简历分享`,
      `${position} 简历 求职`,
    ];

    const allResults = await Promise.all(queries.map(q => searchSingle(q)));

    // Deduplicate and merge results
    const seen = new Set<string>();
    const merged: { title: string; url: string; id: string }[] = [];

    for (const batch of allResults) {
      for (const item of batch) {
        if (!seen.has(item.id) && merged.length < 9) {
          seen.add(item.id);
          merged.push(item);
        }
      }
    }

    res.json({ success: true, results: merged.slice(0, 9) });
  } catch (err: any) {
    console.error('Search reference error:', err?.message || err);
    res.status(500).json({ success: false, error: '搜索失败: ' + (err?.message || '网络错误') });
  }
}

// New endpoint: fetch content of a specific reference
export async function fetchReferenceContent(req: Request, res: Response) {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ success: false, error: '请提供链接' });
      return;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      res.status(400).json({ success: false, error: `获取失败 (HTTP ${response.status})` });
      return;
    }

    const html = await response.text();
    const text = html
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
      .slice(0, 5000);

    res.json({ success: true, text });
  } catch (err: any) {
    console.error('Fetch reference content error:', err?.message || err);
    res.status(500).json({ success: false, error: '获取失败: ' + (err?.message || '网络错误') });
  }
}

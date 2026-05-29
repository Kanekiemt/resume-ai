import { Request, Response } from 'express';

export async function fetchJob(req: Request, res: Response) {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ success: false, error: '请提供岗位链接' });
      return;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      res.status(400).json({ success: false, error: `获取页面失败 (HTTP ${response.status})` });
      return;
    }

    const html = await response.text();

    // Extract text content from HTML, removing scripts/styles
    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate to reasonable length
    const truncated = cleaned.slice(0, 15000);

    res.json({ success: true, text: truncated, url });
  } catch (err: any) {
    console.error('Fetch error:', err);
    if (err?.name === 'TimeoutError') {
      res.status(400).json({ success: false, error: '获取页面超时，请检查链接或手动粘贴职位描述' });
    } else {
      res.status(500).json({ success: false, error: '获取失败: ' + (err?.message || '网络错误') });
    }
  }
}

import { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const systemPrompt = readFileSync(join(__dirname, '..', 'prompts', 'refine-section.txt'), 'utf-8');
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

async function callWithRetry(body: any, apiKey: string, maxRetries = 2): Promise<string> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = 2000 * Math.pow(2, attempt - 1);
      console.log(`[refine] Retry ${attempt}/${maxRetries} after ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
    try {
      const response = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });
      if (response.ok) {
        const json = await response.json() as any;
        return json?.choices?.[0]?.message?.content || '';
      }
      const errText = await response.text();
      console.error(`[refine] API error ${response.status}:`, errText.slice(0, 200));
      if (response.status === 401 || response.status === 403) throw new Error('AUTH:' + errText);
      if (response.status === 503 || response.status === 429) { lastError = new Error('服务繁忙，重试中...'); continue; }
      throw new Error(`API 返回 ${response.status}`);
    } catch (err: any) {
      if (err.message?.startsWith('AUTH:')) throw err;
      lastError = err;
      if (attempt < maxRetries - 1) continue;
    }
  }
  throw lastError || new Error('AI 请求失败');
}

function safeJsonParse(text: string): any {
  try { return JSON.parse(text); } catch {}
  let cleaned = text;
  const mdMatch = text.match(/\`\`\`(?:json)?\s*([\s\S]*?)\`\`\`/);
  if (mdMatch) cleaned = mdMatch[1];
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  try { return JSON.parse(cleaned); } catch {}
  for (let i = cleaned.length - 1; i > cleaned.length / 2; i--) {
    try { return JSON.parse(cleaned.slice(0, i) + '}'); } catch {}
    try { return JSON.parse(cleaned.slice(0, i) + '"}'); } catch {}
  }
  let depth = 0, inString = false, escaped = false;
  for (const ch of cleaned) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') depth--;
  }
  if (depth > 0) { cleaned += '}'.repeat(depth); try { return JSON.parse(cleaned); } catch {} }
  const outer = cleaned.match(/\{[\s\S]*\}/);
  if (outer) {
    let inner = outer[0].replace(/,(\s*[}\]])/g, '$1');
    try { return JSON.parse(inner); } catch {}
    inner = inner.replace(/,(\s*\})/g, '$1').replace(/,(\s*\])/g, '$1');
    try { return JSON.parse(inner); } catch {}
  }
  throw new Error('JSON parse failed after all repairs');
}

export async function refineSection(req: Request, res: Response) {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '') || '';
    if (!apiKey) {
      res.status(400).json({ success: false, error: 'API Key 未设置' });
      return;
    }

    const { section, feedback, jobText } = req.body;
    if (!section || !feedback) {
      res.status(400).json({ success: false, error: '缺少模块内容或修改要求' });
      return;
    }

    const userContent = [
      '## 当前模块（JSON）',
      JSON.stringify(section, null, 2),
      '## 用户修改要求',
      feedback,
      jobText ? `\n## 岗位描述（参考）\n${jobText}` : '',
    ].join('\n\n');

    const text = await callWithRetry({
      model: 'deepseek-chat',
      max_tokens: 2048,
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    }, apiKey);

    if (!text) {
      res.status(500).json({ success: false, error: 'AI 返回了空响应' });
      return;
    }

    const data = safeJsonParse(text);
    console.log('[refine] Refined section:', data?.title, '| items:', data?.items?.length);
    res.json({ success: true, data });
  } catch (err: any) {
    const msg = err?.message || '';
    console.error('[refine] Error:', msg);
    if (msg.startsWith('AUTH:')) {
      res.status(401).json({ success: false, error: 'API Key 无效' });
    } else {
      res.status(500).json({ success: false, error: msg || '精调失败' });
    }
  }
}

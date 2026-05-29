import { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const systemPrompt = readFileSync(join(__dirname, '..', 'prompts', 'selfcheck-system.txt'), 'utf-8');

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

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';

async function callWithRetry(body: any, apiKey: string, maxRetries = 3): Promise<string> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 12000);
      console.log(`[selfcheck] Retry ${attempt}/${maxRetries} after ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
    try {
      const response = await fetch(DEEPSEEK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000),
      });
      if (response.ok) {
        const json = await response.json() as any;
        return json?.choices?.[0]?.message?.content || '';
      }
      const errText = await response.text();
      console.error(`[selfcheck] DeepSeek error ${response.status}:`, errText.slice(0, 300));
      if (response.status === 401 || response.status === 403) {
        throw new Error('AUTH:' + errText);
      }
      if (response.status === 503 || response.status === 429) {
        lastError = new Error(`DeepSeek 服务繁忙 (${response.status})，正在重试...`);
        continue;
      }
      throw new Error(`API 返回 ${response.status}: ${errText.slice(0, 200)}`);
    } catch (err: any) {
      if (err.message?.startsWith('AUTH:')) throw err;
      lastError = err;
      if (attempt < maxRetries - 1) continue;
    }
  }
  throw lastError || new Error('AI 请求失败，已达到最大重试次数');
}

export async function selfCheck(req: Request, res: Response) {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '') || process.env.DEEPSEEK_API_KEY || '';
    if (!apiKey) {
      res.status(400).json({ success: false, error: 'API Key 未设置' });
      return;
    }

    const { resumeJson, jobText } = req.body;
    if (!resumeJson || !jobText) {
      res.status(400).json({ success: false, error: '缺少简历内容或职位描述' });
      return;
    }

    const userContent = `## 生成的简历（JSON格式）\n\n${JSON.stringify(resumeJson, null, 2)}\n\n## 目标岗位描述\n\n${jobText}`;

    const text = await callWithRetry({
      model: 'deepseek-chat',
      max_tokens: 2048,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    }, apiKey);

    if (!text) {
      res.status(500).json({ success: false, error: 'AI 返回了空响应' });
      return;
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON in self-check:', text.slice(0, 300));
      res.status(500).json({ success: false, error: '自查结果解析失败' });
      return;
    }

    try {
      const data = safeJsonParse(jsonMatch[0]);
      res.json({ success: true, data });
    } catch (parseErr: any) {
      console.error('Self-check JSON parse failed:', parseErr?.message);
      console.error('Raw:', jsonMatch[0].slice(0, 500));
      res.status(500).json({ success: false, error: '自查结果 JSON 解析失败，请重试' });
    }
  } catch (err: any) {
    const msg = err?.message || '';
    console.error('Self-check error:', msg);
    if (msg.startsWith('AUTH:')) {
      res.status(401).json({ success: false, error: 'API Key 无效或被拒绝，请检查设置' });
    } else if (msg.includes('繁忙') || msg.includes('重试')) {
      res.status(503).json({ success: false, error: 'DeepSeek 服务当前繁忙，请稍后重试（已自动重试3次）' });
    } else {
      res.status(500).json({ success: false, error: msg || '自查失败' });
    }
  }
}

import { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const systemPrompt = readFileSync(join(__dirname, '..', 'prompts', 'fix-resume.txt'), 'utf-8');

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

const PLACEHOLDER_RE = /[（(]原样[）)]|^姓名$|^电话$|^邮箱$|^城市$|^学校名$|^学位$|^专业$|^公司名$|^职位$|^项目名$|^角色$|^时间$|^JD匹配技能名|^动作动词|可补充方向/;
function stripPlaceholders(obj: any) {
  if (!obj || typeof obj !== 'object') return;
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === 'string' && PLACEHOLDER_RE.test(obj[k])) { obj[k] = ''; }
    else if (Array.isArray(obj[k])) obj[k] = obj[k].filter((x: any) => typeof x === 'string' ? !PLACEHOLDER_RE.test(x) : (stripPlaceholders(x), true));
    else if (typeof obj[k] === 'object') stripPlaceholders(obj[k]);
  }
}

async function callWithRetry(body: any, apiKey: string, maxRetries = 3): Promise<string> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 12000);
      console.log(`[fix] Retry ${attempt}/${maxRetries} after ${delay}ms...`);
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
      console.error(`[fix] DeepSeek error ${response.status}:`, errText.slice(0, 300));
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

export async function fixResume(req: Request, res: Response) {
  try {
    const apiKey = req.headers.authorization?.replace('Bearer ', '') || process.env.DEEPSEEK_API_KEY || '';
    if (!apiKey) {
      res.status(400).json({ success: false, error: 'API Key 未设置' });
      return;
    }

    const { resumeJson, jobText, checkResult } = req.body;
    if (!resumeJson || !checkResult) {
      res.status(400).json({ success: false, error: '缺少简历内容或自查结果' });
      return;
    }

    const issuesText = checkResult.issues?.map((i: any) =>
      `[${i.priority}] ${i.section}: ${i.content}`
    ).join('\n') || '';

    const suggestionsText = checkResult.sectionFeedback?.map((fb: any) =>
      `【${fb.section}】${fb.comment}\n${(fb.suggestions || []).map((s: string) => `  - ${s}`).join('\n')}`
    ).join('\n\n') || '';

    const userContent = [
      '## 当前简历（JSON）',
      JSON.stringify(resumeJson, null, 2),
      '## 岗位描述',
      jobText || '',
      '## 自查问题列表',
      issuesText,
      '## 逐段修改建议',
      suggestionsText,
    ].join('\n\n');

    const text = await callWithRetry({
      model: 'deepseek-chat',
      max_tokens: 4096,
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
      console.error('No JSON in fix response:', text.slice(0, 500));
      res.status(500).json({ success: false, error: '修复结果解析失败' });
      return;
    }

    try {
      const data = safeJsonParse(jsonMatch[0]);
      console.log('[fix] AI response sections:', data?.sections?.map((s: any) => `${s.title}(${s.items?.length || 0} items)`).join(', '));
      // Log what changed vs original
      for (const section of (data?.sections || [])) {
        const orig = resumeJson?.sections?.find((os: any) => os.id === section.id);
        const changed = JSON.stringify(section) !== JSON.stringify(orig);
        if (changed) console.log(`[fix] Section "${section.title}" CHANGED`);
        else console.log(`[fix] Section "${section.title}" unchanged`);
      }
      stripPlaceholders(data);
      res.json({ success: true, data });
    } catch (parseErr: any) {
      console.error('Fix JSON parse failed:', parseErr?.message);
      res.status(500).json({ success: false, error: '修复结果 JSON 解析失败' });
    }
  } catch (err: any) {
    console.error('Fix resume error:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || '修复失败' });
  }
}

import { Request, Response } from 'express';
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

// ── Surname whitelist for name validation ──
const COMMON_SURNAMES = /^(赵|钱|孙|李|周|吴|郑|王|冯|陈|褚|卫|蒋|沈|韩|杨|朱|秦|许|何|吕|施|张|孔|曹|严|华|金|魏|陶|姜|戚|谢|邹|喻|柏|水|窦|章|云|苏|潘|葛|奚|范|彭|郎|鲁|韦|昌|马|苗|凤|花|方|俞|任|袁|柳|酆|鲍|史|唐|费|廉|岑|薛|雷|贺|倪|汤|滕|殷|罗|毕|郝|邬|安|常|乐|于|时|傅|皮|卞|齐|康|伍|余|元|卜|顾|孟|平|黄|和|穆|萧|尹|姚|邵|湛|汪|祁|毛|禹|狄|米|贝|明|臧|计|伏|成|戴|谈|宋|茅|庞|熊|纪|舒|屈|项|祝|董|梁|杜|阮|蓝|闵|席|季|麻|强|贾|路|娄|危|江|童|颜|郭|梅|盛|林|刁|钟|徐|邱|骆|高|夏|蔡|田|樊|胡|凌|霍|虞|万|支|柯|昝|管|卢|莫|经|房|裘|缪|干|解|应|宗|丁|宣|贲|邓|郁|单|杭|洪|包|诸|左|石|崔|吉|钮|龚|程|嵇|邢|滑|裴|陆|荣|翁|荀|羊|于|惠|甄|麴|家|封|芮|羿|储|靳|汲|邴|糜|松|井|段|富|巫|乌|焦|巴|弓|牧|隗|山|谷|车|侯|宓|蓬|全|郗|班|仰|秋|仲|伊|宫|宁|仇|栾|暴|甘|钭|厉|戎|祖|武|符|刘|景|詹|束|龙|叶|幸|司|韶|郜|黎|蓟|薄|印|宿|白|怀|蒲|邰|从|鄂|索|咸|籍|赖|卓|蔺|屠|蒙|池|乔|阴|鬱|胥|能|苍|双|闻|莘|党|翟|谭|贡|劳|逄|姬|申|扶|堵|冉|宰|郦|雍|卻|璩|桑|桂|濮|牛|寿|通|边|扈|燕|冀|郏|浦|尚|农|温|别|庄|晏|柴|瞿|阎|充|慕|连|茹|习|宦|艾|鱼|容|向|古|易|慎|戈|廖|庾|终|暨|居|衡|步|都|耿|满|弘|匡|国|文|寇|广|禄|阙|东|欧|殳|沃|利|蔚|越|夔|隆|师|巩|厍|聂|晁|勾|敖|融|冷|訾|辛|阚|那|简|饶|空|曾|毋|沙|乜|养|鞠|须|丰|巢|关|蒯|相|查|后|荆|红|游|竺|权|逮|盍|益|桓|公|万俟|司马|上官|欧阳|夏侯|诸葛|闻人|东方|赫连|皇甫|尉迟|公羊|澹台|公冶|宗政|濮阳|淳于|单于|太叔|申屠|公孙|仲孙|轩辕|令狐|钟离|宇文|长孙|慕容|鲜于|闾丘|司徒|司空|亓官|司寇|仉|督|子车|颛孙|端木|巫马|公西|漆雕|乐正|壤驷|公良|拓跋|夹谷|宰父|谷梁|晋|楚|闫|法|汝|鄢|涂|钦|归|海|岳|帅|缑|亢|况|后|有|琴|梁丘|左丘|东门|西门|商|牟|佘|佴|伯|赏|南宫|墨|哈|谯|笪|年|爱|阳|佟|第五|言|福|百)/;

// Section headers that signal end of personal info area
const SECTION_STOP = /教育背景|项目经历|实习经历|工作经历|实践经历|校园经历|专业技能|自我评价|证书|语言|获奖|荣誉/;

// Extract personal info locally instead of relying on AI
function extractPersonalInfo(resumeText: string) {
  const info: Record<string, string> = {};

  // ── Phone & Email (reliable, extract first) ──
  const phoneMatch = resumeText.match(/1[3-9]\d{9}/);
  if (phoneMatch) info.phone = phoneMatch[0];

  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) info.email = emailMatch[0];

  // ── Find header boundary (stop at first section header) ──
  const allLines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
  let headerEnd = allLines.length;
  for (let i = 0; i < allLines.length; i++) {
    if (SECTION_STOP.test(allLines[i])) { headerEnd = i; break; }
  }
  const headerLines = allLines.slice(0, headerEnd);

  // ── Name extraction ──
  let nameConfidence = 'low';
  const nameLabelMatch = resumeText.match(/姓名[：:\s]*([^\n]{2,4})/);
  if (nameLabelMatch && /^[一-龥]{2,4}$/.test(nameLabelMatch[1].trim())) {
    info.name = nameLabelMatch[1].trim();
    nameConfidence = COMMON_SURNAMES.test(info.name) ? 'high' : 'low';
  } else {
    // Isolate name: strip phone, email, punctuation from header lines before phone/email
    let phoneIdx = headerLines.length;
    for (let i = 0; i < headerLines.length; i++) {
      if (/1[3-9]\d{9}/.test(headerLines[i]) || /@/.test(headerLines[i])) {
        phoneIdx = i; break;
      }
    }

    // Join header lines before phone into one string, then clean
    let candidateBlock = headerLines.slice(0, phoneIdx).join(' ');
    // Remove phone, email, all ASCII, separators, common noise
    candidateBlock = candidateBlock
      .replace(/1[3-9]\d{9}/g, '')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
      .replace(/[|丨｜/\\·•\-—–\s]+/g, '')
      .replace(/[a-zA-Z0-9@.\-+]/g, '')
      .replace(/[^\x00-\x7F一-鿿]/g, '');

    // Find the first 2-4 CJK sequence that starts with a known surname
    const cjkChunks = candidateBlock.match(/[一-龥]{2,4}/g) || [];
    for (const chunk of cjkChunks) {
      if (COMMON_SURNAMES.test(chunk) && !SECTION_STOP.test(chunk)) {
        info.name = chunk;
        nameConfidence = 'high';
        break;
      }
    }
    // If no surname match but there IS a CJK chunk, capture it with low confidence
    if (!info.name && cjkChunks.length > 0) {
      const first = cjkChunks[0];
      if (!SECTION_STOP.test(first)) {
        info.name = first;
        nameConfidence = 'low';
      }
    }
  }

  // Tag name confidence for AI prompt
  (info as any)._nameConfidence = nameConfidence;

  // ── Education ──
  const schoolLabelMatch = resumeText.match(/(?:学校|院校|教育背景|毕业院校)[：:\s]*([^\n]{2,20})/);
  const schoolNameMatch = resumeText.match(/([^\n]{2,12}(?:大学|学院|学校))/);
  if (schoolLabelMatch) {
    info.school = schoolLabelMatch[1].trim().replace(/[|丨｜·•\-—–]+/g, '').trim();
  } else if (schoolNameMatch) {
    info.school = schoolNameMatch[1].trim();
  }

  let degreeMatch = resumeText.match(/(?:学历|学位)[：:\s]*(本科|硕士|博士|大专)/);
  if (!degreeMatch) degreeMatch = resumeText.match(/(本科|硕士|博士|大专)/);
  if (degreeMatch) info.degree = degreeMatch[1].trim();

  const majorMatch = resumeText.match(/(?:专业)[：:\s]*([^\n]{2,30})/);
  if (majorMatch) {
    const m = majorMatch[1].trim();
    if (m.length >= 3 && !/^(技能|证书|语言|自我评价|实习|项目|教育)/.test(m)) info.major = m;
  }

  // Location
  const locMatch = resumeText.match(/(?:所在地|城市|地址)[：:\s]*([^\n]{2,10})/);
  if (locMatch) info.location = locMatch[1].trim();

  return info;
}

// Patterns that look like placeholder text — replace with empty string
const PLACEHOLDER_PATTERNS = [
  /[（(]原样[）)]/,
  /[（(]如有[）)]/,
  /[（(]选填[）)]/,
  /^姓名$/,
  /^电话$/,
  /^邮箱$/,
  /^城市$/,
  /^学校名$/,
  /^学位$/,
  /^专业$/,
  /^公司名$/,
  /^职位$/,
  /^项目名$/,
  /^角色$/,
  /^时间$/,
  /^JD匹配技能名/,
  /^动作动词/,
  /^GPA、/,
  /可补充方向/,
];

function sanitizePlaceholders(obj: any) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      for (const pattern of PLACEHOLDER_PATTERNS) {
        if (pattern.test(val)) {
          console.log('[sanitize] Stripping placeholder:', key, '=', JSON.stringify(val));
          obj[key] = '';
          break;
        }
      }
    } else if (Array.isArray(val)) {
      obj[key] = val.filter((item: any, i: number) => {
        if (typeof item === 'string') {
          for (const pattern of PLACEHOLDER_PATTERNS) {
            if (pattern.test(item)) {
              console.log('[sanitize] Removing placeholder array item[', i, ']:', JSON.stringify(item));
              return false;
            }
          }
        } else if (typeof item === 'object') {
          sanitizePlaceholders(item);
        }
        return true;
      });
    } else if (typeof val === 'object') {
      sanitizePlaceholders(val);
    }
  }
  // Also check personalInfo specifically
  if (obj.personalInfo) {
    for (const k of ['name', 'phone', 'email', 'location']) {
      const v = obj.personalInfo[k];
      if (typeof v === 'string' && PLACEHOLDER_PATTERNS.some(p => p.test(v))) {
        console.log('[sanitize] Stripping personalInfo.' + k + ':', JSON.stringify(v));
        obj.personalInfo[k] = '';
      }
    }
  }
}

async function callWithRetry(body: any, apiKey: string, maxRetries = 3): Promise<string> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(2000 * Math.pow(2, attempt - 1), 12000);
      console.log(`[generate] Retry ${attempt}/${maxRetries} after ${delay}ms...`);
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
      console.error(`[generate] DeepSeek error ${response.status}:`, errText.slice(0, 300));
      if (response.status === 401 || response.status === 403) {
        throw new Error('AUTH:' + errText);
      }
      // 503 or 429 — retry
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

export async function generateResume(req: Request, res: Response) {
  try {
    // Use client-provided key first, fall back to server's DEEPSEEK_API_KEY env var
    const apiKey = req.headers.authorization?.replace('Bearer ', '') || '';
    if (!apiKey) {
      res.status(400).json({ success: false, error: '请先在设置页面填入 API Key' });
      return;
    }

    const { resumeText, jobText, referenceText } = req.body;
    if (!resumeText || !jobText) {
      res.status(400).json({ success: false, error: '缺少简历内容或职位描述' });
      return;
    }

    // ── Phase 1: Extract personal info & education LOCALLY ──
    console.log('[generate] Raw resume text first 300 chars:', resumeText.slice(0, 300));
    const extracted = extractPersonalInfo(resumeText);
    console.log('[generate] Extracted:', JSON.stringify(extracted));

    // Build education section locally — never let AI touch it
    const educationItems: any[] = [];
    if (extracted.school || extracted.degree || extracted.major) {
      // Try to find education duration from resume text
      const durationMatch = resumeText.match(/(\d{4}\.\d{2})\s*[-–—至到]\s*(\d{4}\.\d{2})/);
      educationItems.push({
        id: 'edu_1',
        school: extracted.school || '',
        degree: extracted.degree || '',
        major: extracted.major || '',
        duration: durationMatch ? `${durationMatch[1]}-${durationMatch[2]}` : '',
        bullets: [] as string[],
      });
    }

    const localPersonalInfo = {
      name: extracted.name || '',
      phone: extracted.phone || '',
      email: extracted.email || '',
      location: extracted.location || '',
    };

    const localEducation = {
      id: 'education',
      title: '教育背景',
      type: 'education',
      visible: true,
      items: educationItems,
    };

    // ── Phase 2: AI handles everything, can correct OCR artifacts ──
    const nameConfidence = (extracted as any)._nameConfidence || 'low';

    const AI_SYSTEM_PROMPT = `你是一个简历格式化助手。你的任务是将原始简历文本转录为结构化 JSON，仅做必要的格式整理。

## 核心原则：忠实于原文
- 所有信息必须来源于原始文本，一字不改
- 严禁编造、替换、美化、优化任何实体名称（人名、公司名、学校名、项目名）
- 严禁将原文中的公司名/学校名/项目名替换为其他名称
- 如果原文写"斯麦国际教育"，你必须输出"斯麦国际教育"，不得改为"斯凯奇中国"或其他
- 如果原文写"长春大学"，你必须输出"长春大学"，不得改为其他学校
- 原文缺失的信息留空字符串 ""

## 系统预提取字段
系统已从文本中预提取了电话、邮箱、学校等信息。这些字段已通过规则校验，可靠性高。
- 姓名标注为 [可信度: high] 时直接使用
- 姓名标注为 [可信度: low] 时，从原文中验证，无法确认则返回 ""
- 电话和邮箱直接使用预提取值

## 教育背景
- 从原文提取学校、学位、专业、时间段
- 如果原文缺失某项，留空

## 实习/项目经历
- 照抄原文的公司名、职位名、项目名
- bullets 从原文描述中拆分，每条一句话
- 可以补全 STAR 结构（动作+方法+结果），但不改变事实内容

## 专业技能
- 从原文技能列表中提取，与 JD 关键词匹配
- 每个技能一个 {id, name} 对象

## 自我评价
- 从原文自我评价中整理为 3-4 句话
- 使用第一人称

## 输出格式
只输出 JSON:
{
  "personalInfo": {"name":"","phone":"","email":"","location":""},
  "jdKeywords": [],
  "sections": [
    {"id":"education","title":"教育背景","type":"education","visible":true,"items":[{"id":"edu_1","school":"","degree":"","major":"","duration":"","bullets":[]}]},
    {"id":"internship","title":"实习/志愿经历","type":"work_experience","visible":true,"items":[]},
    {"id":"projects","title":"项目经验","type":"projects","visible":true,"items":[]},
    {"id":"skills","title":"专业技能","type":"skills","visible":true,"items":[{"id":"s1","name":""}]},
    {"id":"self_evaluation","title":"自我评价","type":"self_evaluation","visible":true,"items":[{"id":"eval_1","bullets":[""]}]}
  ]
}`;

    const userContent = [
      '## 系统预提取的字段（带可信度）',
      `姓名: ${localPersonalInfo.name || '(未提取)'} [可信度: ${nameConfidence}]`,
      `电话: ${localPersonalInfo.phone || '(未提取)'} [可信度: high]`,
      `邮箱: ${localPersonalInfo.email || '(未提取)'} [可信度: high]`,
      `所在地: ${localPersonalInfo.location || '(未提取)'}`,
      educationItems.length > 0 ? `学校: ${educationItems[0].school} | 学位: ${educationItems[0].degree} | 专业: ${educationItems[0].major} | 时间: ${educationItems[0].duration}` : '',
      '',
      '## 原始简历全文（供参考和修正）',
      resumeText,
      '## 目标岗位描述',
      jobText,
      referenceText ? `## 参考简历\n${referenceText}` : '',
    ].filter(Boolean).join('\n\n');

    console.log('[generate] === Raw text sent to AI (first 800 chars) ===');
    console.log(resumeText.slice(0, 800));
    console.log('[generate] === End raw text preview ===');
    // Also write to file for easy access
    // Don't write debug file to project dir — causes Vite HMR full reload!

    const text = await callWithRetry({
      model: 'deepseek-chat',
      max_tokens: 4096,
      temperature: 0.3,
      messages: [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    }, apiKey);

    if (!text) {
      res.status(500).json({ success: false, error: 'AI 返回了空响应' });
      return;
    }

    // ── Phase 3: Use AI output (AI corrects OCR errors) ──
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON in response:', text.slice(0, 500));
      res.status(500).json({ success: false, error: 'AI 返回的格式无法解析' });
      return;
    }

    try {
      const aiData = safeJsonParse(jsonMatch[0]);
      sanitizePlaceholders(aiData);

      // Local extraction first for name/phone/email (rule-based, reliable)
      // AI only as fallback (AI may "guess" names incorrectly)
      const aiPersonalInfo = aiData.personalInfo || {};
      const finalPersonalInfo = {
        name: extracted.name || aiPersonalInfo.name || '',
        phone: extracted.phone || aiPersonalInfo.phone || '',
        email: extracted.email || aiPersonalInfo.email || '',
        location: aiPersonalInfo.location || extracted.location || '',
      };
      console.log('[generate] Final personalInfo:', JSON.stringify(finalPersonalInfo));

      // Merge: AI sections + ensure education is present
      const aiSections = aiData.sections || [];
      const sections = [];
      // Education from AI (preferred) or local fallback
      const aiEducation = aiSections.find((s: any) => s.id === 'education');
      if (aiEducation && aiEducation.items?.length > 0) {
        sections.push(aiEducation);
      } else {
        sections.push(localEducation);
      }
      // Remaining AI sections
      for (const id of ['internship', 'projects', 'skills', 'self_evaluation']) {
        const aiSec = aiSections.find((s: any) => s.id === id);
        if (aiSec) sections.push(aiSec);
      }

      const data = {
        personalInfo: finalPersonalInfo,
        jdKeywords: aiData.jdKeywords || [],
        matchedKeywords: aiData.matchedKeywords || [],
        missingKeywords: aiData.missingKeywords || [],
        keywordCoverage: aiData.keywordCoverage || 0,
        sections,
      };

      console.log('[generate] sections:', sections.map((s: any) => `${s.title}(${s.items?.length || 0} items)`).join(', '));
      res.json({ success: true, data });
    } catch (parseErr: any) {
      console.error('JSON parse failed after repair:', parseErr?.message);
      console.error('Raw text (first 1000 chars):', jsonMatch[0].slice(0, 1000));
      console.error('Raw text (last 500 chars):', jsonMatch[0].slice(-500));
      res.status(500).json({ success: false, error: 'AI 返回 JSON 解析失败，请重试' });
    }
  } catch (err: any) {
    const msg = err?.message || '';
    console.error('Generate error:', msg);
    if (msg.startsWith('AUTH:')) {
      res.status(401).json({ success: false, error: 'API Key 无效或被拒绝，请检查设置' });
    } else if (msg.includes('繁忙') || msg.includes('重试')) {
      res.status(503).json({ success: false, error: 'DeepSeek 服务当前繁忙，请稍后重试（已自动重试3次）' });
    } else {
      res.status(500).json({ success: false, error: msg || '生成失败，请重试' });
    }
  }
}

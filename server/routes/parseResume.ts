import { Request, Response } from 'express';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { setLastParsedText } from '../state.js';
import Tesseract from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = '';

// ── Quality scoring for extraction results (Bug 3 fix) ──
function scoreText(text: string): number {
  let score = 0;
  // Base: Chinese character count
  score += (text.match(/[一-龥]/g) || []).length;
  // Bonus for well-known resume section headers (indicates correct ordering)
  if (/教育背景/.test(text)) score += 500;
  if (/实习|工作.*经历/.test(text)) score += 400;
  if (/项目.*经验/.test(text)) score += 400;
  if (/专业.*技能/.test(text)) score += 300;
  if (/自我.*评价/.test(text)) score += 200;
  if (/(?:大学|学院|学校)/.test(text)) score += 500;
  // Penalty for garbled text markers
  if (/�/.test(text)) score -= 1000;
  // Penalty for OCR junk patterns
  const junk = (text.match(/[^\x00-\x7F一-鿿㐀-䶿\s\n\d\w@.\-+|，。！？；：、"'【】「」（）《》…—\/]/g) || []).length;
  score -= junk * 5;
  return score;
}

// ── Bug 2 fix: insert space between characters with wide gaps ──
function buildLinesWithSpacing(items: any[], lineTolerance: number): string[] {
  if (items.length === 0) return [];

  const lines: string[] = [];
  let currentLine = '';
  let lastX = -Infinity;
  let lastY = -Infinity;

  for (const item of items) {
    const x = item.transform?.[4] ?? 0;
    const y = item.transform?.[5] ?? 0;

    if (lastY === -Infinity || Math.abs(y - lastY) < lineTolerance) {
      // Same line — insert space if X gap is wide
      if (lastX !== -Infinity && x - lastX > 15) {
        currentLine += ' ';
      }
      currentLine += item.str;
    } else {
      // New line
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = item.str;
    }
    lastX = x + (item.width ?? 0);
    lastY = y;
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines;
}

// ── OCR path: mupdf render + tesseract ──
async function ocrPdf(buffer: Buffer): Promise<string> {
  console.log('[ocr] Starting OCR pipeline...');
  try {
    const mupdf = await import('mupdf');
    const doc = mupdf.PDFDocument.openDocument(buffer, 'application/pdf');
    const pageCount = doc.countPages();
    console.log('[ocr] PDF has', pageCount, 'pages');

    const texts: string[] = [];
    for (let i = 0; i < pageCount; i++) {
      const page = doc.loadPage(i);
      const pixmap = page.toPixmap(mupdf.Matrix.scale(3, 3), mupdf.ColorSpace.DeviceRGB);
      const pngBuffer = Buffer.from(pixmap.asPNG());

      console.log('[ocr] Page', i + 1, '- image', pixmap.getWidth(), 'x', pixmap.getHeight());

      const { data: { text } } = await Tesseract.recognize(pngBuffer, 'chi_sim+eng', {
        logger: (m) => { if (m.status === 'recognizing text') console.log('[ocr] progress:', Math.round(m.progress * 100), '%'); }
      });

      if (text.trim()) {
        texts.push(text.trim());
        console.log('[ocr] Page', i + 1, 'extracted', text.length, 'chars');
      }
    }

    const result = texts.join('\n\n');
    console.log('[ocr] Total extracted:', result.length, 'chars');
    return result;
  } catch (err: any) {
    console.error('[ocr] OCR pipeline failed:', err?.message);
    throw err;
  }
}

// ── pdfjs-dist path (with layout-aware Y/X sorting + spacing) ──
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const data = new Uint8Array(buffer);
    const doc = await pdfjsLib.getDocument({ data, useWorkerFetch: false }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const items = [...content.items] as any[];
      const LINE_TOLERANCE = 4; // tighter grouping to avoid cross-line merge

      // Bug 1 fix: sort Y descending (top→bottom in PDF coordinate system)
      items.sort((a, b) => {
        const aY = a.transform?.[5] ?? 0;
        const bY = b.transform?.[5] ?? 0;
        if (Math.abs(aY - bY) < LINE_TOLERANCE) {
          const aX = a.transform?.[4] ?? 0;
          const bX = b.transform?.[4] ?? 0;
          return aX - bX;
        }
        return bY - aY; // top to bottom
      });

      const lines = buildLinesWithSpacing(items, LINE_TOLERANCE);
      const text = lines.join('\n');
      if (text) pages.push(text);
    }

    return pages.join('\n\n');
  } catch (err: any) {
    console.error('[pdf] pdfjs extraction failed:', err?.message);
    throw err;
  }
}

// ── pdf-parse fallback ──
async function extractWithPdfParse(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(buffer);
    return data.text || '';
  } catch (err: any) {
    console.error('[pdf] pdf-parse extraction failed:', err?.message);
    throw err;
  }
}

export async function parseResume(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: '请上传简历文件' });
      return;
    }

    const { originalname, mimetype, buffer } = file;
    // Fix Latin-1 garbled UTF-8 filenames
    let fileName = originalname;
    try {
      if (!/[一-鿿]/.test(fileName)) {
        const candidate = Buffer.from(fileName, 'latin1').toString('utf8');
        if (/[一-鿿]/.test(candidate)) fileName = candidate;
      }
    } catch {}
    const ext = fileName.toLowerCase().split('.').pop();
    let text = '';

    if (ext === 'txt' || mimetype === 'text/plain') {
      text = buffer.toString('utf-8');
    } else if (ext === 'docx' || mimetype.includes('ooxml') || mimetype.includes('word')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (ext === 'pdf' || mimetype === 'application/pdf') {
      // Three extraction methods in parallel
      const [pdfjsText, ocrText, pdfParseText] = await Promise.all([
        extractPdfText(buffer).catch(() => ''),
        ocrPdf(buffer).catch(() => ''),
        extractWithPdfParse(buffer).catch(() => ''),
      ]);

      // Apply CJK cleaning to each result before scoring
      const clean = (t: string) => {
        t = t.replace(/([一-鿿])\s+([一-鿿])/g, '$1$2');
        t = t.replace(/\s*([，。！？；：、"'【】「」（）《》…—])\s*/g, '$1');
        return t;
      };

      const candidates = [
        { label: 'pdfjs', text: clean(pdfjsText), sourceBonus: 1000 },
        { label: 'OCR', text: clean(ocrText), sourceBonus: 0 },
        { label: 'pdf-parse', text: clean(pdfParseText), sourceBonus: 800 },
      ];

      // Score-based selection: prefer direct text extraction (pdfjs/pdf-parse) over OCR
      // because direct extraction preserves original characters; OCR can misread names
      let best = candidates[0];
      let bestScore = -Infinity;
      for (const c of candidates) {
        const s = scoreText(c.text) + c.sourceBonus;
        console.log('[parse] %s: score=%d (base=%d + bonus=%d), cjk=%d',
          c.label, s, scoreText(c.text), c.sourceBonus, (c.text.match(/[一-龥]/g) || []).length);
        if (s > bestScore) { bestScore = s; best = c; }
      }

      if (best && bestScore > 300) {
        text = best.text;
        console.log('[parse] Selected %s (score=%d)', best.label, bestScore);
      } else {
        res.status(400).json({
          success: false,
          error: '无法解析此 PDF。请尝试：\n1. 用 Word 打开 PDF 后另存为 .docx 上传\n2. 切换到「粘贴简历内容」直接粘贴文本',
        });
        return;
      }
    } else {
      try {
        text = buffer.toString('utf-8');
      } catch {
        try {
          const result = await mammoth.extractRawText({ buffer });
          text = result.value;
        } catch {
          text = await extractPdfText(buffer);
        }
      }
    }

    text = text.trim().replace(/\n{3,}/g, '\n\n');
    text = text.replace(/([一-鿿])\s+([一-鿿])/g, '$1$2');
    text = text.replace(/\s*([，。！？；：、"'【】「」（）《》…—])\s*/g, '$1');
    text = text.replace(/([一-鿿])\s+(\d|[a-zA-Z])/g, '$1$2');
    text = text.replace(/(\d|[a-zA-Z])\s+([一-鿿])/g, '$1$2');
    if (!text) {
      res.status(400).json({ success: false, error: '无法从文件中提取文字内容，请确认文件格式是否正确' });
      return;
    }

    console.log('[parse] Extracted', text.length, 'chars from', fileName);
    console.log('[parse] First 200 chars:', text.slice(0, 200));
    setLastParsedText(text);
    res.json({ success: true, text, fileName, version: 'v4-scored' });
  } catch (err: any) {
    console.error('Parse error:', err?.message || err);
    res.status(500).json({ success: false, error: '文件解析失败: ' + (err?.message || '未知错误，请尝试上传 txt 格式') });
  }
}

import { Request, Response } from 'express';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import Tesseract from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = '';

function scoreText(text: string): number {
  let score = 0;
  score += (text.match(/[一-龥]/g) || []).length;
  if (/教育背景/.test(text)) score += 500;
  if (/实习|工作.*经历/.test(text)) score += 400;
  if (/项目.*经验/.test(text)) score += 400;
  if (/专业.*技能/.test(text)) score += 300;
  if (/自我.*评价/.test(text)) score += 200;
  if (/(?:大学|学院|学校)/.test(text)) score += 500;
  if (/�/.test(text)) score -= 1000;
  return score;
}

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
      if (lastX !== -Infinity && x - lastX > 15) currentLine += ' ';
      currentLine += item.str;
    } else {
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = item.str;
    }
    lastX = x + (item.width ?? 0);
    lastY = y;
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const doc = await pdfjsLib.getDocument({ data, useWorkerFetch: false }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items = [...content.items] as any[];
    const TOL = 4;
    items.sort((a, b) => {
      const aY = a.transform?.[5] ?? 0;
      const bY = b.transform?.[5] ?? 0;
      if (Math.abs(aY - bY) < TOL) return (a.transform?.[4] ?? 0) - (b.transform?.[4] ?? 0);
      return bY - aY;
    });
    const lines = buildLinesWithSpacing(items, TOL);
    if (lines.length > 0) pages.push(lines.join('\n'));
  }
  return pages.join('\n\n');
}

async function ocrPdf(buffer: Buffer): Promise<string> {
  const mupdf = await import('mupdf');
  const doc = mupdf.PDFDocument.openDocument(buffer, 'application/pdf');
  const pageCount = doc.countPages();
  const texts: string[] = [];
  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i);
    const pixmap = page.toPixmap(mupdf.Matrix.scale(3, 3), mupdf.ColorSpace.DeviceRGB);
    const pngBuffer = Buffer.from(pixmap.asPNG());
    const { data: { text } } = await Tesseract.recognize(pngBuffer, 'chi_sim+eng');
    if (text.trim()) texts.push(text.trim());
  }
  return texts.join('\n\n');
}

async function extractWithPdfParse(buffer: Buffer): Promise<string> {
  const pdfParse = await import('pdf-parse');
  const data = await pdfParse.default(buffer);
  return data.text || '';
}

export async function debugPdf(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: '请上传简历文件' });
      return;
    }

    const { buffer, mimetype } = file;
    if (mimetype !== 'application/pdf' && !file.originalname.toLowerCase().endsWith('.pdf')) {
      // for non-PDF files, return simple text result
      let text = '';
      try { text = buffer.toString('utf-8'); } catch {}
      if (!text) { const r = await mammoth.extractRawText({ buffer }); text = r.value; }
      res.json({ success: true, type: 'text', pdfjs: text, ocr: '', pdfparse: '', scores: { pdfjs: scoreText(text), ocr: 0, pdfparse: 0 } });
      return;
    }

    const clean = (t: string) => {
      t = t.replace(/([一-鿿])\s+([一-鿿])/g, '$1$2');
      t = t.replace(/\s*([，。！？；：、"'【】「」（）《》…—])\s*/g, '$1');
      return t;
    };

    const [pdfjsRaw, ocrRaw, pdfparseRaw] = await Promise.all([
      extractPdfText(buffer).catch((e: any) => `ERROR: ${e.message}`),
      ocrPdf(buffer).catch((e: any) => `ERROR: ${e.message}`),
      extractWithPdfParse(buffer).catch((e: any) => `ERROR: ${e.message}`),
    ]);

    const pdfjsText = clean(pdfjsRaw);
    const ocrText = clean(ocrRaw);
    const pdfparseText = clean(pdfparseRaw);

    res.json({
      success: true,
      type: 'pdf',
      pdfjs: pdfjsText.slice(0, 5000),
      ocr: ocrText.slice(0, 5000),
      pdfparse: pdfparseText.slice(0, 5000),
      scores: {
        pdfjs: scoreText(pdfjsText),
        ocr: scoreText(ocrText),
        pdfparse: scoreText(pdfparseText),
      },
      selected: (() => {
        const best = [
          { name: 'pdfjs', score: scoreText(pdfjsText) },
          { name: 'ocr', score: scoreText(ocrText) },
          { name: 'pdfparse', score: scoreText(pdfparseText) },
        ].sort((a, b) => b.score - a.score)[0];
        return best;
      })(),
    });
  } catch (err: any) {
    console.error('[debugPdf] Error:', err?.message);
    res.status(500).json({ success: false, error: err?.message });
  }
}

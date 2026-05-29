import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseResume } from './routes/parseResume.js';
import { fetchJob } from './routes/fetchJob.js';
import { generateResume } from './routes/generate.js';
import { searchReference, fetchReferenceContent } from './routes/searchReference.js';
import { selfCheck } from './routes/selfCheck.js';
import { fixResume } from './routes/fixResume.js';
import { refineSection } from './routes/refineSection.js';
import { searchSectionRefs } from './routes/searchSectionRefs.js';
import { debugPdf } from './routes/debugPdf.js';

import { lastParsedText } from './state.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/parse-resume', upload.single('file'), (req, res, next) => {
  parseResume(req, res).catch(next);
});
app.post('/api/fetch-job', (req, res, next) => {
  fetchJob(req, res).catch(next);
});
app.post('/api/generate-resume', (req, res, next) => {
  generateResume(req, res).catch(next);
});
app.post('/api/search-reference', (req, res, next) => {
  searchReference(req, res).catch(next);
});
app.post('/api/fetch-reference-content', (req, res, next) => {
  fetchReferenceContent(req, res).catch(next);
});
app.post('/api/self-check', (req, res, next) => {
  selfCheck(req, res).catch(next);
});
app.post('/api/fix-resume', (req, res, next) => {
  fixResume(req, res).catch(next);
});
app.post('/api/refine-section', (req, res, next) => {
  refineSection(req, res).catch(next);
});
app.post('/api/search-section-refs', (req, res, next) => {
  searchSectionRefs(req, res).catch(next);
});
app.post('/api/debug-pdf', upload.single('file'), (req, res, next) => {
  debugPdf(req, res).catch(next);
});
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/debug-last-parse', (_req, res) => {
  res.json({ text: lastParsedText, length: lastParsedText.length });
});

// Serve static frontend in production only
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '..', 'dist');
const { existsSync } = await import('fs');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // Express v5 uses regex pattern for catch-all, not '*'
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global error handler - always return JSON for API routes
app.use((err: any, req: any, res: any, _next: any) => {
  console.error('[server error]', err?.message || err);
  res.status(500).json({ success: false, error: err?.message || '服务器内部错误' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`[server] v3.0 ready on http://localhost:${PORT}`);
  console.log(`[server] pdfjs(sorted) + pdf-parse + OCR, scored selection, debug endpoint`);
});

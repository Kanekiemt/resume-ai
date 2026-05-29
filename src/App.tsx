import { useState } from 'react';
import { useSettingsStore } from './store/useSettingsStore';
import { useSessionStore } from './store/useSessionStore';
import { generateWordDoc, downloadWordFile } from './utils/wordExport';
import { apiUrl } from './utils/api';
import Header from './components/layout/Header';
import UploadStep from './components/steps/UploadStep';
import JobStep from './components/steps/JobStep';
import GenerateStep from './components/steps/GenerateStep';
import PreviewStep from './components/steps/PreviewStep';
import AlertBanner from './components/ui/AlertBanner';
import ConfirmModal from './components/ui/ConfirmModal';
import CinematicBackground from './components/ui/CinematicBackground';

type Step = 'upload' | 'job' | 'generate' | 'preview';

const STEPS: Step[] = ['upload', 'job', 'generate', 'preview'];

const ANIME_QUOTES = [
  { text: '諦めない心が、未来を切り拓く', from: 'NARUTO' },
  { text: '努力は裏切らない', from: '僕のヒーローアカデミア' },
  { text: '人は誰でも、自分だけの空を持っている', from: 'SLAM DUNK' },
  { text: '限界を超えろ、それが成長だ', from: '鬼滅の刃' },
  { text: '敗北は死よりも重い', from: '進撃の巨人' },
];

function AnimeQuoteBanner() {
  const [idx, setIdx] = useState(0);
  const quote = ANIME_QUOTES[idx % ANIME_QUOTES.length];

  return (
    <div
      className="text-center py-2 cursor-pointer select-none transition-opacity duration-500"
      onClick={() => setIdx(idx + 1)}
      style={{ position: 'relative', zIndex: 1 }}
    >
      <span className="anime-quote">
        {quote.text}
        <span className="ml-2 opacity-40 text-[10px] tracking-[0.1em]" style={{ fontStyle: 'normal' }}>
          — {quote.from}
        </span>
      </span>
    </div>
  );
}

export default function App() {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const session = useSessionStore();
  const [step, setStep] = useState<Step>('upload');
  const [templateId, setTemplateId] = useState('classic');
  const [tailored, setTailored] = useState<any>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [referenceText, setReferenceText] = useState('');
  const [refResults, setRefResults] = useState<{ title: string; url: string; id: string }[]>([]);
  const [selectedRefId, setSelectedRefId] = useState('');
  const [useReference, setUseReference] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [pendingFix, setPendingFix] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [refining, setRefining] = useState<string | null>(null);

  // ── Upload handlers ──
  const handlePasteText = (text: string) => {
    if (!text.trim()) return;
    session.setResumeText(text.trim());
    session.setResumeFileName('手动粘贴.txt');
    setStep('job');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('正在解析简历...');
    setError('');
    session.setResumeFileName(file.name);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(apiUrl('/api/parse-resume'), { method: 'POST', body: fd });
      const text = await res.text();
      let json: any;
      try { json = JSON.parse(text); } catch { setError('解析失败，请重试'); session.setResumeFileName(''); setStatus(''); return; }
      if (!json.success) {
        setError(json.error || '解析失败');
        session.setResumeFileName('');
      } else {
        session.setResumeText(json.text);
        setStep('job');
      }
    } catch (err: any) {
      setError('请求失败: ' + (err?.message || '网络错误'));
      session.setResumeFileName('');
    }
    setStatus('');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => session.setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Job handlers ──
  const handleFetchJob = async () => {
    setStatus('正在获取岗位信息...');
    setError('');
    if (session.jobUrl.trim()) {
      try {
        const res = await fetch(apiUrl('/api/fetch-job'), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: session.jobUrl }),
        });
        const text = await res.text();
        let json: any;
        try { json = JSON.parse(text); } catch { setError('获取失败，请手动粘贴岗位描述'); setStatus(''); return; }
        if (json.success) session.setJobText(json.text);
        else setError(json.error || '获取失败，请手动粘贴');
      } catch { setError('获取失败，请手动粘贴岗位描述'); }
    }
    setStatus('');
    setStep('generate');
  };

  // ── Reference handlers ──
  const searchReferenceResume = async () => {
    if (!session.positionTitle.trim()) return;
    setStatus('正在从牛客网搜索...');
    setError('');
    setRefResults([]);
    setSelectedRefId('');
    try {
      const res = await fetch(apiUrl('/api/search-reference'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: session.positionTitle, company: session.companyName }),
      });
      const text = await res.text();
      let json: any;
      try { json = JSON.parse(text); } catch { setError('搜索结果解析失败'); setStatus(''); return; }
      if (json.success && json.results?.length > 0) {
        setRefResults(json.results);
      } else {
        setError(json.error || '没有找到相关参考简历');
      }
    } catch { setError('搜索参考简历失败'); }
    setStatus('');
  };

  const fetchSelectedRefContent = async (url: string, id: string) => {
    setSelectedRefId(id);
    setStatus('正在获取参考内容...');
    setError('');
    try {
      const res = await fetch(apiUrl('/api/fetch-reference-content'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const text = await res.text();
      let json: any;
      try { json = JSON.parse(text); } catch { setError('参考内容解析失败'); setStatus(''); return; }
      if (json.success) setReferenceText(json.text);
      else setError(json.error || '获取失败');
    } catch { setError('获取参考内容失败'); }
    setStatus('');
  };

  // ── Generate ──
  const handleGenerate = async () => {
    if (!apiKey) { setError('API Key 未设置'); return; }
    setStatus('AI 正在生成定制简历...');
    setError('');
    try {
      const body: any = { resumeText: session.resumeText, jobText: session.jobText };
      if (useReference && referenceText) body.referenceText = referenceText;
      const res = await fetch(apiUrl('/api/generate-resume'), {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!text) { setError('服务器返回空响应，请检查 API Key 是否有效'); setStatus(''); return; }
      let json: any;
      try { json = JSON.parse(text); } catch { setError('服务器返回格式异常: ' + text.slice(0, 100)); setStatus(''); return; }
      if (!json.success) setError(json.error || '生成失败');
      else { setTailored(json.data); setStep('preview'); }
    } catch (err: any) { setError('网络错误: ' + (err?.message || '请检查网络连接')); }
    setStatus('');
  };

  // ── Export ──
  const handleExportWord = () => {
    if (!tailored) return;
    const doc = generateWordDoc(tailored, session.photoPreview);
    downloadWordFile(doc, `${tailored.personalInfo?.name || '简历'}_定制版.docx`);
  };

  // ── Self-check & fix ──
  const handleSelfCheck = async () => {
    if (!tailored || !session.jobText) return;
    setChecking(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/self-check'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ resumeJson: tailored, jobText: session.jobText }),
      });
      const text = await res.text();
      if (!text) { setError('自查返回空响应，请检查 API Key'); setChecking(false); return; }
      let json: any;
      try { json = JSON.parse(text); } catch { setError('自查结果解析失败: ' + text.slice(0, 100)); setChecking(false); return; }
      if (json.success) setCheckResult(json.data);
      else setError(json.error || '自查失败');
    } catch (err: any) { setError('自查请求失败: ' + (err?.message || '网络错误')); }
    setChecking(false);
  };

  const handleFixResume = async () => {
    if (!tailored || !checkResult) return;
    setFixing(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/fix-resume'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ resumeJson: tailored, jobText: session.jobText, checkResult }),
      });
      const text = await res.text();
      if (!text) { setError('修复返回空响应，请检查 API Key'); setFixing(false); return; }
      let json: any;
      try { json = JSON.parse(text); } catch { setError('修复结果解析失败: ' + text.slice(0, 100)); setFixing(false); return; }
      if (json.success) {
        setPendingFix(json.data);
        setShowConfirm(true);
      } else {
        setError(json.error || '修复失败');
      }
    } catch (err: any) { setError('修复请求失败: ' + (err?.message || '网络错误')); }
    setFixing(false);
  };

  const applySection = (sectionId: string) => {
    if (!pendingFix || !tailored) return;
    const fixedSection = pendingFix.sections?.find((s: any) => s.id === sectionId);
    if (!fixedSection) return;
    setTailored((prev: any) => {
      const next = structuredClone(prev);
      const idx = next.sections?.findIndex((s: any) => s.id === sectionId);
      if (idx >= 0) next.sections[idx] = fixedSection;
      return next;
    });
  };

  const applyAllSections = () => {
    if (!pendingFix) return;
    setTailored(pendingFix);
    setPendingFix(null);
    setShowConfirm(false);
    setCheckResult(null);
  };

  const handleRefineSection = async (sectionId: string, feedback: string) => {
    if (!pendingFix || !session.jobText) return;
    const section = pendingFix.sections?.find((s: any) => s.id === sectionId);
    if (!section) return;

    setRefining(sectionId);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/refine-section'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ section, feedback, jobText: session.jobText }),
      });
      const text = await res.text();
      if (!text) { setError('精调返回空响应'); setRefining(null); return; }
      let json: any;
      try { json = JSON.parse(text); } catch { setError('精调结果解析失败'); setRefining(null); return; }
      if (json.success) {
        setPendingFix((prev: any) => {
          const next = structuredClone(prev);
          const idx = next.sections?.findIndex((s: any) => s.id === sectionId);
          if (idx >= 0) next.sections[idx] = json.data;
          return next;
        });
      } else {
        setError(json.error || '精调失败');
      }
    } catch (err: any) { setError('精调请求失败: ' + (err?.message || '网络错误')); }
    setRefining(null);
  };

  const cancelFix = () => {
    setPendingFix(null);
    setShowConfirm(false);
  };

  // ── Step navigation ──
  const handleStepClick = (target: Step) => {
    const targetIdx = STEPS.indexOf(target);
    const currentIdx = STEPS.indexOf(step);
    if (targetIdx < currentIdx) setStep(target);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      <CinematicBackground />

      <Header
        currentStep={step}
        templateId={templateId}
        onStepClick={handleStepClick}
        onTemplateChange={setTemplateId}
        onExportWord={handleExportWord}
      />

      <AnimeQuoteBanner />

      <AlertBanner type="error" message={error} onDismiss={() => setError('')} />
      <AlertBanner type="status" message={status} />

      <ConfirmModal
        show={showConfirm}
        pendingFix={pendingFix}
        tailored={tailored}
        onApplySection={applySection}
        onApplyAll={applyAllSections}
        onCancel={cancelFix}
        onRefineSection={handleRefineSection}
        refining={refining}
        positionTitle={session.positionTitle}
        companyName={session.companyName}
      />

      <main>
        {step === 'upload' && (
          <UploadStep
            onFileSelect={handleFileSelect}
            onPasteText={handlePasteText}
            onPhotoSelect={handlePhotoSelect}
            photoPreview={session.photoPreview}
          />
        )}

        {step === 'job' && (
          <JobStep
            resumeText={session.resumeText}
            resumeFileName={session.resumeFileName}
            positionTitle={session.positionTitle}
            companyName={session.companyName}
            jobUrl={session.jobUrl}
            jobText={session.jobText}
            onPositionTitleChange={session.setPositionTitle}
            onCompanyNameChange={session.setCompanyName}
            onJobUrlChange={session.setJobUrl}
            onJobTextChange={session.setJobText}
            onFetchJob={handleFetchJob}
            onNext={() => setStep('generate')}
            onReUpload={() => { session.setResumeText(''); setStep('upload'); }}
          />
        )}

        {step === 'generate' && (
          <GenerateStep
            resumeFileName={session.resumeFileName}
            resumeText={session.resumeText}
            positionTitle={session.positionTitle}
            companyName={session.companyName}
            jobText={session.jobText}
            useReference={useReference}
            referenceText={referenceText}
            refResults={refResults}
            selectedRefId={selectedRefId}
            onToggleReference={() => setUseReference(!useReference)}
            onSearchReference={searchReferenceResume}
            onSelectReference={fetchSelectedRefContent}
            onGenerate={handleGenerate}
          />
        )}

        {step === 'preview' && tailored && (
          <PreviewStep
            tailored={tailored}
            templateId={templateId}
            photoUrl={session.photoPreview}
            checkResult={checkResult}
            checking={checking}
            fixing={fixing}
            onSelfCheck={handleSelfCheck}
            onFixResume={handleFixResume}
            onBack={() => setStep('generate')}
          />
        )}
      </main>

      <footer className="app-footer">
        <div className="slash-divider">
          <span className="slash-icon">⚔</span>
        </div>
        ResumeAI — 智能简历定制工具
      </footer>
    </div>
  );
}

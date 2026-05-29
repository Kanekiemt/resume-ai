type Step = 'upload' | 'job' | 'generate' | 'preview';

interface StepInfo {
  key: Step;
  label: string;
}

const STEPS: StepInfo[] = [
  { key: 'upload', label: '上传简历' },
  { key: 'job', label: '岗位要求' },
  { key: 'generate', label: 'AI 生成' },
  { key: 'preview', label: '预览导出' },
];

interface Props {
  currentStep: Step;
  templateId: string;
  onStepClick: (step: Step) => void;
  onTemplateChange: (id: string) => void;
  onExportWord: () => void;
  onOpenSettings: () => void;
}

export default function Header({
  currentStep,
  templateId,
  onStepClick,
  onTemplateChange,
  onExportWord,
  onOpenSettings,
}: Props) {
  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const isPreview = currentStep === 'preview';

  return (
    <header className="app-header">
      <div className="header-accent" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="logo-mark">R</div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-wider leading-tight">ResumeAI</h1>
            <p className="hidden sm:block text-[11px] text-gold-light/70 tracking-[0.08em]">智能简历定制</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onOpenSettings}
            className="btn-ghost text-[11px] sm:text-[13px] py-1 sm:py-1.5 px-2 sm:px-3 text-white/60 border-white/10"
            title="API Key 设置"
          >
            ⚙
          </button>
          {isPreview && (
            <>
              <select
                value={templateId}
                onChange={(e) => onTemplateChange(e.target.value)}
                className="header-select text-[11px] sm:text-xs"
              >
                <option value="classic">经典</option>
                <option value="modern">现代</option>
                <option value="compact">紧凑</option>
              </select>
              <button onClick={onExportWord} className="btn-gold text-[11px] sm:text-[13px] py-1 sm:py-1.5 px-2.5 sm:px-4">
                Word
              </button>
              <button onClick={() => window.print()} className="btn-ghost text-[11px] sm:text-[13px] py-1 sm:py-1.5 px-2.5 sm:px-4 text-white/80 border-white/15">
                PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Step progress */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3 sm:pb-4">
        {/* Desktop step indicators */}
        <div className="hidden sm:flex items-center gap-0">
          {STEPS.map((s, i) => {
            const isActive = i === stepIndex;
            const isDone = i < stepIndex;

            return (
              <div key={s.key} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : undefined }}>
                <button
                  onClick={() => isDone && onStepClick(s.key)}
                  className="flex items-center gap-2"
                  style={{
                    cursor: isDone ? 'pointer' : 'default',
                    opacity: isActive ? 1 : isDone ? 0.8 : 0.4,
                    transition: 'opacity 0.3s',
                    background: 'none',
                    border: 'none',
                  }}
                >
                  <div className={`step-dot ${isActive ? 'active' : ''} ${isDone ? 'done' : 'pending'}`}>
                    {isDone ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="text-xs tracking-wide" style={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                  }}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && <div className={`step-connector ${isDone ? 'active' : ''}`} />}
              </div>
            );
          })}
        </div>

        {/* Mobile step indicator: compact pills */}
        <div className="flex sm:hidden items-center gap-2">
          <span className="text-[11px] text-gold-light/70 tracking-wider font-medium">
            {stepIndex + 1}/{STEPS.length}
          </span>
          <div className="flex-1 flex gap-1">
            {STEPS.map((_, i) => {
              const isActive = i === stepIndex;
              const isDone = i < stepIndex;
              return (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full transition-all duration-300"
                  style={{
                    background: isDone
                      ? 'var(--gold)'
                      : isActive
                      ? 'linear-gradient(90deg, var(--gold), rgba(200, 169, 110, 0.6))'
                      : 'rgba(255,255,255,0.12)',
                  }}
                />
              );
            })}
          </div>
          <span className="text-[11px] text-white/60 font-medium">
            {STEPS[stepIndex].label}
          </span>
        </div>
      </div>
    </header>
  );
}

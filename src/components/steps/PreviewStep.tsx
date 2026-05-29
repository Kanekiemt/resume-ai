import ResumePreview from '../resume/ResumePreview';

interface Props {
  tailored: any;
  templateId: string;
  photoUrl: string;
  checkResult: any;
  checking: boolean;
  fixing: boolean;
  onSelfCheck: () => void;
  onFixResume: () => void;
  onBack: () => void;
}

export default function PreviewStep({
  tailored,
  templateId,
  photoUrl,
  checkResult,
  checking,
  fixing,
  onSelfCheck,
  onFixResume,
  onBack,
}: Props) {
  if (!tailored) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1.5rem' }}>
    <div className="animate-fade-in-up stagger-children space-y-5" style={{ width: '100%', maxWidth: 860 }}>
      {/* Preview header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-xl font-bold text-navy">简历预览</h2>
        <div className="flex items-center gap-2">
          <button onClick={onSelfCheck} disabled={checking} className="btn-ghost text-[13px] py-1.5 px-4 border-amber-500/30 text-amber-700">
            {checking ? (
              <span className="flex items-center gap-2">
                <div className="spinner" style={{ borderTopColor: '#b45309', borderColor: 'rgba(217,119,6,0.15)' }} />
                检测中...
              </span>
            ) : (
              '自查匹配度'
            )}
          </button>
          <button onClick={onBack} className="text-xs text-ink-muted bg-transparent border-none cursor-pointer hover:text-navy transition-colors">
            ← 返回
          </button>
        </div>
      </div>

      {/* Check result */}
      {checkResult && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-navy">岗位匹配度检测报告</h3>
              <span className={`score-badge ${checkResult.overallScore >= 80 ? 'score-high' : checkResult.overallScore >= 60 ? 'score-mid' : 'score-low'}`}>
                {checkResult.overallScore} 分
              </span>
            </div>
            <button onClick={onFixResume} disabled={fixing} className="btn-primary text-[13px] py-2 px-[18px]">
              {fixing ? '修复中...' : '一键修复'}
            </button>
          </div>

          {/* Issues */}
          {checkResult.issues?.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[13px] font-semibold text-ink-light mb-2.5">主要问题</h4>
              <div className="flex flex-col gap-1.5">
                {checkResult.issues.map((issue: any, i: number) => (
                  <div key={i} className={`check-issue priority-${issue.priority}`}>
                    <span className={`priority-label priority-${issue.priority}`}>{issue.priority}</span>
                    <span className="text-[13px] text-ink leading-relaxed">{issue.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section feedback */}
          {checkResult.sectionFeedback?.length > 0 && (
            <div>
              <h4 className="text-[13px] font-semibold text-ink-light mb-2.5">逐段反馈</h4>
              <div className="flex flex-col gap-2">
                {checkResult.sectionFeedback.map((fb: any, i: number) => (
                  <div key={i} className="feedback-card">
                    <p className="text-[13px] font-semibold text-navy mb-1">{fb.section}</p>
                    <p className="text-xs text-ink-muted mb-1.5 leading-relaxed">{fb.comment}</p>
                    {fb.suggestions?.length > 0 && (
                      <ul className="suggestion-list">
                        {fb.suggestions.map((s: string, j: number) => (
                          <li key={j}>{s}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resume preview */}
      <ResumePreview key={JSON.stringify(tailored).slice(0, 100)} data={tailored} templateId={templateId} photoUrl={photoUrl} />
    </div>
    </div>
  );
}

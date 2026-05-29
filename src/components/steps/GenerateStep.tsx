interface RefResult {
  title: string;
  url: string;
  id: string;
}

interface Props {
  resumeFileName: string;
  resumeText: string;
  positionTitle: string;
  companyName: string;
  jobText: string;
  useReference: boolean;
  referenceText: string;
  refResults: RefResult[];
  selectedRefId: string;
  onToggleReference: () => void;
  onSearchReference: () => void;
  onSelectReference: (url: string, id: string) => void;
  onGenerate: () => void;
}

export default function GenerateStep({
  resumeFileName,
  resumeText,
  positionTitle,
  companyName,
  jobText,
  useReference,
  referenceText,
  refResults,
  selectedRefId,
  onToggleReference,
  onSearchReference,
  onSelectReference,
  onGenerate,
}: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1.5rem', minHeight: 'calc(100vh - 180px)' }}>
    <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 640 }}>
      <div className="glass-card" style={{ padding: '28px' }}>
        <h2 className="text-lg font-bold text-navy mb-5">确认信息并生成</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="info-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="info-dot gold" />
              <p className="text-xs font-semibold text-navy">简历：{resumeFileName}</p>
            </div>
            <pre className="text-[11px] text-ink-muted max-h-[100px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {resumeText.slice(0, 500)}...
            </pre>
          </div>
          <div className="info-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="info-dot navy" />
              <p className="text-xs font-semibold text-navy">
                岗位：{positionTitle || '手动输入'}
                {companyName ? ` @${companyName}` : ''}
              </p>
            </div>
            <pre className="text-[11px] text-ink-muted max-h-[100px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {jobText.slice(0, 500)}...
            </pre>
          </div>
        </div>

        {/* Reference resumes section */}
        <div className="reference-section">
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <div
              className={`checkbox-custom ${useReference ? 'checked' : ''}`}
              onClick={onToggleReference}
            >
              {useReference && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-[13px] font-semibold text-navy">从牛客网提取参考简历</span>
          </label>

          {useReference && (
            <div className="animate-fade-in pl-7">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={onSearchReference}
                  disabled={!positionTitle.trim()}
                  className="btn-ghost text-xs py-1.5 px-3.5 border-gold/30 text-gold"
                >
                  搜索牛客网 — {positionTitle || '请先填岗位名'}
                </button>
              </div>

              {refResults.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-3">
                  <p className="text-[11px] text-ink-muted mb-0.5">选择一份参考简历：</p>
                  {refResults.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => onSelectReference(r.url, r.id)}
                      className={`ref-result-item ${selectedRefId === r.id ? 'selected' : ''}`}
                    >
                      {r.title}
                    </div>
                  ))}
                </div>
              )}

              {referenceText && (
                <div>
                  <p className="text-xs text-success mb-1.5 font-medium">已选择参考简历</p>
                  <pre className="reference-preview-text">
                    {referenceText.slice(0, 800)}
                    {referenceText.length > 800 && '...'}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <button onClick={onGenerate} className="btn-gold w-full py-3.5 text-[15px] rounded-xl">
          AI 生成定制简历
        </button>
      </div>
    </div>
    </div>
  );
}

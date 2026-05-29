interface Props {
  resumeText: string;
  resumeFileName: string;
  positionTitle: string;
  companyName: string;
  jobUrl: string;
  jobText: string;
  onPositionTitleChange: (v: string) => void;
  onCompanyNameChange: (v: string) => void;
  onJobUrlChange: (v: string) => void;
  onJobTextChange: (v: string) => void;
  onFetchJob: () => void;
  onNext: () => void;
  onReUpload: () => void;
}

export default function JobStep({
  resumeText,
  resumeFileName,
  positionTitle,
  companyName,
  jobUrl,
  jobText,
  onPositionTitleChange,
  onCompanyNameChange,
  onJobUrlChange,
  onJobTextChange,
  onFetchJob,
  onNext,
  onReUpload,
}: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1.5rem', minHeight: 'calc(100vh - 180px)' }}>
    <div className="animate-fade-in-up stagger-children space-y-5" style={{ width: '100%', maxWidth: 640 }}>
      {/* Parsed resume card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="check-icon-badge bg-green-50">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7.5L5.5 10L11 4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-navy">已解析的简历</h2>
          </div>
          <button onClick={onReUpload} className="text-link">重新上传</button>
        </div>
        <div className="file-indicator">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="2" y="1" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1" />
            <path d="M4 4H8M4 6H8M4 8H6" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
          </svg>
          {resumeFileName}
        </div>
        <pre className="resume-preview-text">
          {resumeText.slice(0, 2000)}
          {resumeText.length > 2000 && '\n\n... (已截断)'}
        </pre>
      </div>

      {/* Job input card */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 className="text-base font-bold text-navy mb-4">输入岗位信息</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <input
            value={positionTitle}
            onChange={(e) => onPositionTitleChange(e.target.value)}
            placeholder="岗位名称"
            className="input-premium"
          />
          <input
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            placeholder="公司名称"
            className="input-premium"
          />
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="url"
            value={jobUrl}
            onChange={(e) => onJobUrlChange(e.target.value)}
            placeholder="粘贴招聘链接自动获取..."
            className="input-premium flex-1"
          />
          <button
            onClick={onFetchJob}
            disabled={!jobUrl.trim() && !jobText.trim()}
            className="btn-primary"
            style={{ opacity: !jobUrl.trim() && !jobText.trim() ? 0.5 : 1 }}
          >
            获取
          </button>
        </div>

        <textarea
          value={jobText}
          onChange={(e) => onJobTextChange(e.target.value)}
          placeholder="或直接粘贴招聘描述..."
          rows={8}
          className="textarea-premium"
        />

        {jobText.trim() && (
          <div className="flex justify-end mt-4">
            <button onClick={onNext} className="btn-primary">下一步 →</button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

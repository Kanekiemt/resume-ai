import { useState } from 'react';

interface Props {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPasteText: (text: string) => void;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  photoPreview: string;
}

type UploadTab = 'file' | 'paste';

export default function UploadStep({ onFileSelect, onPasteText, onPhotoSelect, photoPreview }: Props) {
  const [tab, setTab] = useState<UploadTab>('file');
  const [pasteValue, setPasteValue] = useState('');
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 200px)',
        padding: '3rem 1.5rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: 560, position: 'relative', zIndex: 1 }}>

        {/* Title */}
        <div className="text-center" style={{ marginBottom: '2.5rem' }}>
          <h2
            style={{
              fontSize: 'clamp(24px, 3vw, 30px)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 10,
              letterSpacing: '0.03em',
            }}
          >
            开始定制您的简历
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 380, margin: '0 auto', lineHeight: 1.6 }}>
            上传简历文件或直接粘贴内容，AI 将根据目标岗位智能优化
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          marginBottom: '1.25rem',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {(['file', 'paste'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                textAlign: 'center',
                transition: 'all 0.2s',
                background: tab === t ? 'rgba(245,200,120,0.12)' : 'transparent',
                color: tab === t ? 'var(--accent-warm)' : 'var(--text-muted)',
                borderBottom: tab === t ? '2px solid var(--accent-warm)' : '2px solid transparent',
              }}
            >
              {t === 'file' ? '上传简历文件' : '粘贴简历内容'}
            </button>
          ))}
        </div>

        {/* Upload card */}
        <div
          className="frosted-glass"
          style={{ padding: '36px 32px', marginBottom: '1.75rem' }}
        >
          {tab === 'file' ? (
            <>
              {/* PDF upload zone */}
              <label
                className="upload-zone"
                style={{
                  display: 'block',
                  marginBottom: '20px',
                  borderColor: dragOver ? 'var(--accent-warm)' : undefined,
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    const input = document.querySelector('input[data-upload="resume"]') as HTMLInputElement;
                    if (input) {
                      input.files = dt.files;
                      input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                  }
                }}
              >
                <input
                  data-upload="resume"
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={onFileSelect}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                />
                <div style={{ marginBottom: 14 }}>
                  <svg width="44" height="44" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto' }}>
                    <rect x="8" y="4" width="32" height="40" rx="4" stroke="var(--text-muted)" strokeWidth="1.5" fill="none" />
                    <path d="M16 24L24 16L32 24" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M24 16V32" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                    <path d="M14 36H34" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
                  </svg>
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  点击上传 PDF 简历
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  也支持拖拽文件到此处
                </p>
              </label>

              {/* Word upload shortcut */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: '20px',
                padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(91,158,224,0.06)', border: '1px solid rgba(91,158,224,0.12)',
              }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                  <rect x="3" y="2" width="14" height="16" rx="2" stroke="#5b9ee0" strokeWidth="1.2" fill="none" />
                  <path d="M6 6H14M6 9H14M6 12H11M6 15H13" stroke="#5b9ee0" strokeWidth="1" strokeLinecap="round" />
                </svg>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                    上传 Word / TXT 简历
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    支持 .docx / .doc / .txt，解析效果更好
                  </p>
                </div>
                <label
                  style={{
                    padding: '6px 16px', fontSize: 12, fontWeight: 600,
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    background: 'rgba(91,158,224,0.15)', color: '#5b9ee0',
                    border: 'none', transition: 'all 0.2s',
                  }}
                >
                  <input
                    type="file"
                    accept=".docx,.doc,.txt"
                    onChange={onFileSelect}
                    style={{ display: 'none' }}
                  />
                  选择文件
                </label>
              </div>

              <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                最大 10MB · PDF 解析可能受扫描件影响，Word 格式效果最佳
              </p>
            </>
          ) : (
            /* Paste tab */
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                直接粘贴简历内容
              </p>
              <textarea
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
                placeholder="从 Word / PDF 中复制简历全文，粘贴到这里...&#10;&#10;包括个人信息、教育背景、实习/工作经历、项目经验、专业技能、自我评价等"
                rows={14}
                style={{
                  width: '100%', resize: 'vertical',
                  padding: '14px', borderRadius: 'var(--radius-sm)',
                  fontSize: 13, lineHeight: 1.7,
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-primary)',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  outline: 'none',
                }}
                className="textarea-premium"
              />
              <button
                onClick={() => onPasteText(pasteValue)}
                disabled={!pasteValue.trim()}
                className="btn-gold"
                style={{
                  marginTop: 14, width: '100%', padding: '12px 0',
                  fontSize: 14, fontWeight: 700, borderRadius: 'var(--radius)',
                  opacity: pasteValue.trim() ? 1 : 0.5,
                }}
              >
                使用这段内容
              </button>
              <p style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                从 Word 中 Ctrl+A 全选 → Ctrl+C 复制 → 在此 Ctrl+V 粘贴即可
              </p>
            </div>
          )}

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginTop: tab === 'file' ? '0px' : '24px',
              marginBottom: '24px',
            }}
          >
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>选填</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Photo upload */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
              证件照
            </h3>
            <div className="flex items-center gap-4">
              <label className="photo-upload-label">
                <input type="file" accept="image/*" onChange={onPhotoSelect} style={{ display: 'none' }} />
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="2" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="5" cy="6" r="1.5" stroke="currentColor" strokeWidth="1" />
                  <path d="M1 10L4.5 7L7 9L9.5 6.5L13 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
                选择图片
              </label>
              {photoPreview && <img src={photoPreview} alt="证件照" className="photo-preview" />}
              {!photoPreview && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  添加后将在简历右上角展示
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CTA button — file tab only */}
        {tab === 'file' && (
          <div className="text-center">
            <button
              onClick={() => {
                const input = document.querySelector('input[data-upload="resume"]') as HTMLInputElement;
                input?.click();
              }}
              className="btn-gold"
              style={{
                padding: '16px 40px',
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 'var(--radius)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              开始定制
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ transition: 'transform 0.3s ease' }} className="arrow-icon">
                <path d="M3 9H15M15 9L10 4M15 9L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        <style>{`
          .btn-gold:hover .arrow-icon {
            transform: translateX(3px);
          }
        `}</style>
      </div>
    </div>
  );
}

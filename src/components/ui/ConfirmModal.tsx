import { useState } from 'react';
import { diffWords, diffSectionItems } from '../../utils/diff';
import ReferencePanel from './ReferencePanel';

interface Props {
  show: boolean;
  pendingFix: any;
  tailored: any;
  onApplySection: (sectionId: string) => void;
  onApplyAll: () => void;
  onCancel: () => void;
  onRefineSection: (sectionId: string, feedback: string) => Promise<void>;
  refining: string | null;
  positionTitle: string;
  companyName: string;
}

function DiffHighlight({ segments }: { segments: ReturnType<typeof diffWords>['old'] }) {
  return (
    <span>
      {segments.map((seg, i) => (
        <span
          key={i}
          style={{
            background: seg.type === 'added' ? 'rgba(110,207,138,0.3)' : seg.type === 'removed' ? 'rgba(240,144,144,0.3)' : 'transparent',
            textDecoration: seg.type === 'removed' ? 'line-through' : 'none',
            borderRadius: 2,
            padding: '0 1px',
          }}
        >
          {seg.text}
        </span>
      ))}
    </span>
  );
}

function SectionDiffCard({
  sectionId, title, oldSection, newSection, applied, onApply,
  onRefine, isRefining, positionTitle, companyName,
}: {
  sectionId: string; title: string; oldSection: any; newSection: any; applied: boolean;
  onApply: (id: string) => void;
  onRefine: (id: string, feedback: string) => Promise<void>;
  isRefining: boolean;
  positionTitle: string;
  companyName: string;
}) {
  const [showDiff, setShowDiff] = useState(true);
  const [showRefine, setShowRefine] = useState(false);
  const [showRefPanel, setShowRefPanel] = useState(false);
  const [feedback, setFeedback] = useState('');
  const isSkills = newSection?.type === 'skills';

  // Build diff data
  const diffs = diffSectionItems(
    oldSection?.items || [],
    newSection?.items || [],
    isSkills ? ['name'] : ['bullets', 'name', 'company', 'position', 'school', 'degree', 'major']
  );

  const hasChanges = diffs.length > 0 ||
    (isSkills && JSON.stringify(oldSection?.items) !== JSON.stringify(newSection?.items));

  return (
    <div
      style={{
        border: applied ? '1px solid rgba(110,207,138,0.3)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 'var(--radius)',
        marginBottom: 12,
        overflow: 'hidden',
        background: applied ? 'rgba(110,207,138,0.04)' : 'rgba(255,255,255,0.02)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
        }}
        onClick={() => setShowDiff(!showDiff)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', transition: 'transform 0.3s', transform: showDiff ? 'rotate(90deg)' : 'rotate(0)' }}>
            ▶
          </span>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{title}</span>
          {hasChanges && !applied && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
              background: 'rgba(240,160,96,0.15)', color: 'var(--accent-warm)',
            }}>
              有修改
            </span>
          )}
          {applied && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
              background: 'rgba(110,207,138,0.15)', color: 'var(--success)',
            }}>
              已应用
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!applied && !showRefine && !showRefPanel && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setShowRefPanel(!showRefPanel); }}
                className="btn-ghost"
                style={{ padding: '5px 12px', fontSize: 11, borderRadius: 'var(--radius-sm)' }}
              >
                找参考
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowRefine(true); }}
                className="btn-ghost"
                style={{ padding: '5px 14px', fontSize: 11, borderRadius: 'var(--radius-sm)' }}
              >
                不满意？重新调整
              </button>
            </>
          )}
          {!applied && (
            <button
              onClick={(e) => { e.stopPropagation(); onApply(sectionId); }}
              className="btn-primary"
              style={{ padding: '6px 16px', fontSize: 12, borderRadius: 'var(--radius-sm)' }}
            >
              应用
            </button>
          )}
        </div>
      </div>

      {/* Diff content */}
      {showDiff && hasChanges && (
        <div style={{ padding: '14px 16px' }}>
          {isSkills ? (
            /* Skills: show old vs new list */
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  修改前
                </div>
                <div style={{ fontSize: 12, color: 'rgba(240,144,144,0.7)', lineHeight: 1.8 }}>
                  {(oldSection?.items || []).map((it: any, i: number) => (
                    <span key={i}>{it.name}{i < (oldSection?.items || []).length - 1 ? '、' : ''}</span>
                  ))}
                </div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--accent)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  修改后
                </div>
                <div style={{ fontSize: 12, color: 'rgba(110,207,138,0.8)', lineHeight: 1.8 }}>
                  {(newSection?.items || []).map((it: any, i: number) => (
                    <span key={i}>{it.name}{i < (newSection?.items || []).length - 1 ? '、' : ''}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Other sections: inline diff */
            diffs.map((d, di) => (
              <div key={di} style={{ marginBottom: di < diffs.length - 1 ? 10 : 0 }}>
                {d.field !== 'bullets' && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {d.field} (第{d.itemIndex + 1}项)
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                  <div style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, background: 'rgba(240,144,144,0.06)', lineHeight: 1.7 }}>
                    <span style={{ fontSize: 9, color: 'rgba(240,144,144,0.5)', marginRight: 6 }}>旧</span>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                      <DiffHighlight segments={d.diff.old} />
                    </span>
                  </div>
                  <div style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, background: 'rgba(110,207,138,0.06)', lineHeight: 1.7 }}>
                    <span style={{ fontSize: 9, color: 'rgba(110,207,138,0.5)', marginRight: 6 }}>新</span>
                    <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                      <DiffHighlight segments={d.diff.new} />
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}

          {!hasChanges && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0', textAlign: 'center' }}>
              此模块无修改
            </div>
          )}
        </div>
      )}

      {/* Refinement dialog */}
      {showRefine && !applied && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(240,160,96,0.03)' }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            你希望「{title}」这一项怎么改？
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="例如：更突出量化成果、不要改项目名称、增加STAR法则描述、精简技能数量..."
            rows={3}
            className="textarea-premium"
            style={{ fontSize: 12, marginBottom: 10 }}
            disabled={isRefining}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setShowRefine(false); setFeedback(''); }}
              className="btn-ghost"
              style={{ padding: '5px 14px', fontSize: 11 }}
              disabled={isRefining}
            >
              取消
            </button>
            <button
              onClick={async () => {
                if (!feedback.trim() || isRefining) return;
                await onRefine(sectionId, feedback.trim());
                setFeedback('');
                setShowRefine(false);
              }}
              className="btn-primary"
              style={{ padding: '5px 16px', fontSize: 12, borderRadius: 'var(--radius-sm)' }}
              disabled={!feedback.trim() || isRefining}
            >
              {isRefining ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="spinner" style={{ width: 12, height: 12 }} />
                  调整中...
                </span>
              ) : (
                '提交调整'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Reference panel */}
      {showRefPanel && !applied && (
        <ReferencePanel
          sectionType={newSection?.type || ''}
          sectionTitle={title}
          positionTitle={positionTitle}
          companyName={companyName}
          onApplyStyle={async (snippet) => {
            // Use the snippet as style reference
            const feedback = `请参考以下范例的写法风格来改写，保持我的真实经历不变：\n\n「${snippet.snippet}」\n\n亮点：${snippet.highlight}`;
            await onRefine(sectionId, feedback);
            setShowRefPanel(false);
          }}
          onClose={() => setShowRefPanel(false)}
        />
      )}
    </div>
  );
}

export default function ConfirmModal({
  show, pendingFix, tailored,
  onApplySection, onApplyAll, onCancel, onRefineSection, refining,
  positionTitle, companyName,
}: Props) {
  const [appliedSections, setAppliedSections] = useState<Set<string>>(new Set());

  if (!show || !pendingFix) return null;

  const sections = pendingFix.sections || [];

  const handleApply = (sectionId: string) => {
    setAppliedSections(prev => new Set([...prev, sectionId]));
    onApplySection(sectionId);
  };

  const appliedCount = appliedSections.size;
  const totalChanged = sections.filter((s: any) => {
    const old = tailored?.sections?.find((os: any) => os.id === s.id);
    return JSON.stringify(s) !== JSON.stringify(old);
  }).length;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content animate-modal-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 640,
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: 16, flexShrink: 0 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            逐项确认修改
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            AI 已对 {totalChanged} 个模块进行了优化。逐项检查后点击"应用"确认修改。
            {appliedCount > 0 && (
              <span style={{ color: 'var(--success)', marginLeft: 4 }}>（已应用 {appliedCount}/{totalChanged}）</span>
            )}
          </p>
        </div>

        {/* Section list */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {sections.map((s: any) => {
            const oldSection = tailored?.sections?.find((os: any) => os.id === s.id);
            return (
              <SectionDiffCard
                key={s.id}
                sectionId={s.id}
                title={s.title}
                oldSection={oldSection}
                newSection={s}
                applied={appliedSections.has(s.id)}
                onApply={handleApply}
                onRefine={onRefineSection}
                isRefining={refining === s.id}
                positionTitle={positionTitle}
                companyName={companyName}
              />
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center',
          marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            点击每个模块的"应用"按钮单独确认，或
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCancel} className="btn-ghost" style={{ fontSize: 13 }}>关闭</button>
            <button onClick={onApplyAll} className="btn-primary" style={{ fontSize: 13 }}>
              全部应用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

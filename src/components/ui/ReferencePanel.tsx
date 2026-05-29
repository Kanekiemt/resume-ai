import { useState, useEffect } from 'react';
import { getBuiltInRefs } from '../../data/resumeReferences';

interface Snippet {
  snippet: string;
  highlight: string;
  sourceTitle: string;
  sourceUrl: string;
}

interface Props {
  sectionType: string;
  sectionTitle: string;
  positionTitle: string;
  companyName: string;
  onApplyStyle: (snippet: Snippet) => void;
  onClose: () => void;
}

export default function ReferencePanel({
  sectionType, sectionTitle, positionTitle, companyName,
  onApplyStyle, onClose,
}: Props) {
  const [source, setSource] = useState<'builtin' | 'nowcoder'>('builtin');
  const [loading, setLoading] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Load built-in refs immediately
  useEffect(() => {
    if (source === 'builtin') {
      const refs = getBuiltInRefs(sectionType);
      setSnippets(refs);
      setSearched(true);
      setError('');
    } else {
      setSnippets([]);
      setSearched(false);
      setError('');
    }
  }, [source, sectionType]);

  const search = async () => {
    setLoading(true);
    setError('');
    try {
      const apiKey = localStorage.getItem('resume_settings');
      const key = apiKey ? JSON.parse(apiKey)?.state?.apiKey || '' : '';
      const res = await fetch('/api/search-section-refs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ sectionType, sectionTitle, positionTitle: positionTitle || '', companyName: companyName || '' }),
      });
      const text = await res.text();
      let json: any;
      try { json = JSON.parse(text); } catch { setError('返回数据解析失败'); setLoading(false); return; }
      if (json.success) {
        setSnippets(json.snippets || []);
      } else {
        setError(json.error || '搜索失败');
      }
    } catch (err: any) {
      setError('网络错误: ' + (err?.message || ''));
    }
    setLoading(false);
    setSearched(true);
  };

  return (
    <div style={{
      padding: '14px 16px',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(91,158,224,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
          参考范例 — {sectionTitle}
        </span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          cursor: 'pointer', fontSize: 16, lineHeight: 1,
        }}>×</button>
      </div>

      {/* Source tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => setSource('builtin')}
          style={{
            flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            border: 'none', textAlign: 'center', transition: 'all 0.2s',
            background: source === 'builtin' ? 'rgba(91,158,224,0.15)' : 'transparent',
            color: source === 'builtin' ? 'var(--accent)' : 'var(--text-muted)',
          }}
        >
          精选案例库
        </button>
        <button
          onClick={() => setSource('nowcoder')}
          style={{
            flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            border: 'none', borderLeft: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', transition: 'all 0.2s',
            background: source === 'nowcoder' ? 'rgba(91,158,224,0.15)' : 'transparent',
            color: source === 'nowcoder' ? 'var(--accent)' : 'var(--text-muted)',
          }}
        >
          牛客网搜索
        </button>
      </div>

      {source === 'nowcoder' && !searched && !loading && (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            自动搜索牛客网中与「{sectionTitle}」相关的简历优化案例
          </p>
          <button onClick={search} className="btn-primary" style={{ fontSize: 12, padding: '6px 20px' }}>
            开始搜索
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div className="spinner" />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>正在搜索牛客网并提取范例...</span>
        </div>
      )}

      {error && (
        <div style={{ fontSize: 12, color: 'var(--danger)', textAlign: 'center', padding: '8px 0' }}>
          {error}
          <button onClick={search} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12 }}>
            重试
          </button>
        </div>
      )}

      {searched && snippets.length === 0 && !loading && source === 'nowcoder' && (
        <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: 'var(--text-muted)' }}>
          牛客网未找到相关范例，请切换到「精选案例库」查看内置参考
        </div>
      )}

      {snippets.map((s, i) => (
        <div key={i} style={{
          padding: '10px 12px', marginBottom: 8,
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          {/* Highlight + source badge */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
              background: 'rgba(245,200,120,0.15)', color: 'var(--accent-warm)',
            }}>
              {s.highlight}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 6,
              background: 'rgba(91,158,224,0.12)', color: 'var(--accent)',
              letterSpacing: '.04em',
            }}>
              {s.sourceTitle.includes('超级简历') ? '超级简历' :
               s.sourceTitle.includes('职徒') ? '职徒简历' :
               s.sourceTitle.includes('100分') || s.sourceTitle.includes('锤子') ? '锤子简历' :
               s.sourceTitle.includes('牛客') ? '牛客网' : '精选案例'}
            </span>
            <a
              href={s.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 10, color: 'var(--text-muted)', textDecoration: 'none', marginLeft: 'auto' }}
              title={s.sourceTitle}
            >
              {s.sourceTitle.slice(0, 25)}... ↗
            </a>
          </div>

          {/* Snippet text */}
          <div style={{
            fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7,
            padding: '8px 10px', borderRadius: 6,
            background: 'rgba(255,255,255,0.03)',
            borderLeft: '2px solid rgba(91,158,224,0.3)',
            marginBottom: 8,
          }}>
            {s.snippet}
          </div>

          {/* Apply button */}
          <button
            onClick={() => onApplyStyle(s)}
            className="btn-primary"
            style={{ fontSize: 11, padding: '4px 14px', borderRadius: 'var(--radius-sm)' }}
          >
            参考这个写法
          </button>
        </div>
      ))}
    </div>
  );
}

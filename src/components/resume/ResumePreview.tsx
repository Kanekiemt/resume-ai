import { useState, useEffect } from 'react';
import { classicTemplate } from '../../templates/classic';
import { modernTemplate } from '../../templates/modern';
import { compactTemplate } from '../../templates/compact';
import type { ResumeTemplate } from '../../types';
import EditableText from './EditableText';

const templates: Record<string, ResumeTemplate> = {
  classic: classicTemplate,
  modern: modernTemplate,
  compact: compactTemplate,
};

interface Props {
  data: any;
  templateId: string;
  photoUrl?: string;
}

function SectionIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    work_experience: 'M4 3h10a1 1 0 011 1v5H3V4a1 1 0 011-1zm-1 7h12v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3z',
    education: 'M3 2l7 4-7 4V8l5-2-5-2V2zm9 5v6h2V7h-2z',
    skills: 'M9 2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1h4zm0 8a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2a1 1 0 011-1h4zm6-8a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V3a1 1 0 011-1h4z',
    projects: 'M5 2a1 1 0 00-1 1v3a1 1 0 001 1h3l2 2V3a1 1 0 00-1-1H5zm6.5 4.5L10 8l1.5 1.5L13 8l-1.5-1.5z',
    certificates: 'M10 2a1 1 0 011 1v5l2-1.5L15 8V3a1 1 0 00-1-1h-4zm-6 2a1 1 0 00-1 1v9l3-2 3 2V5a1 1 0 00-1-1H4z',
    self_evaluation: 'M8 2a6 6 0 110 12A6 6 0 018 2zm0 2a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm0 5c-1.5 0-3 .75-3 2h6c0-1.25-1.5-2-3-2z',
  };

  const d = icons[type] || icons.work_experience;

  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0, opacity: 0.7 }}>
      <path d={d} />
    </svg>
  );
}

function WorkExperienceItem({ item, template, idx, update }: any) {
  return (
    <div style={{ marginBottom: template.spacing.itemGap }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          flexWrap: 'wrap',
          marginBottom: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: template.font.sizes.body, color: template.colors.primary }}>
            <EditableText text={item.company || ''} onSave={(v) => update(['sections', idx, 'items', item._idx ?? 0, 'company'], v)} inline />
          </span>
          <span style={{ color: template.colors.muted, fontSize: template.font.sizes.small }}>|</span>
          <span style={{ fontSize: template.font.sizes.body, color: template.colors.text }}>
            <EditableText text={item.position || ''} onSave={(v) => update(['sections', idx, 'items', item._idx ?? 0, 'position'], v)} inline />
          </span>
        </div>
        <span style={{ fontSize: template.font.sizes.small, color: template.colors.muted }}>
          <EditableText text={item.duration || ''} onSave={(v) => update(['sections', idx, 'items', item._idx ?? 0, 'duration'], v)} inline />
        </span>
      </div>
      {(item.bullets as string[])?.map((bullet: string, bi: number) => (
        <div key={bi} style={{ display: 'flex', gap: '0.4rem', marginTop: 1, fontSize: template.font.sizes.body, lineHeight: 1.65 }}>
          <span style={{ color: template.colors.accent, flexShrink: 0, fontWeight: 700 }}>·</span>
          <EditableText text={bullet} onSave={(v) => update(['sections', idx, 'items', item._idx ?? 0, 'bullets', bi], v)} />
        </div>
      ))}
    </div>
  );
}

function EducationItem({ item, template, idx, update }: any) {
  return (
    <div style={{ marginBottom: template.spacing.itemGap }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: template.font.sizes.body, color: template.colors.primary }}>
            <EditableText text={item.school || ''} onSave={(v) => update(['sections', idx, 'items', item._idx ?? 0, 'school'], v)} inline />
          </span>
          <span style={{ color: template.colors.muted, fontSize: template.font.sizes.small }}>|</span>
          <span style={{ fontSize: template.font.sizes.body, color: template.colors.text }}>
            <EditableText text={item.degree || ''} onSave={(v) => update(['sections', idx, 'items', item._idx ?? 0, 'degree'], v)} inline />
          </span>
          <span style={{ color: template.colors.muted, fontSize: template.font.sizes.small }}>·</span>
          <span style={{ fontSize: template.font.sizes.body, color: template.colors.text }}>
            <EditableText text={item.major || ''} onSave={(v) => update(['sections', idx, 'items', item._idx ?? 0, 'major'], v)} inline />
          </span>
        </div>
        <span style={{ fontSize: template.font.sizes.small, color: template.colors.muted }}>
          <EditableText text={item.duration || ''} onSave={(v) => update(['sections', idx, 'items', item._idx ?? 0, 'duration'], v)} inline />
        </span>
      </div>
    </div>
  );
}

export default function ResumePreview({ data, templateId, photoUrl }: Props) {
  const [editing, setEditing] = useState<any>(data);
  const template = templates[templateId] || classicTemplate;

  // Sync internal editing state when parent data changes (e.g. after AI fix)
  useEffect(() => {
    setEditing(data);
  }, [data]);

  const update = (path: (string | number)[], value: any) => {
    setEditing((prev: any) => {
      const next = structuredClone(prev);
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return next;
    });
  };

  const pinfo = editing.personalInfo || {};
  const visibleSections = (editing.sections || []).filter((s: any) => s.visible !== false);

  return (
    <div
      id="resume-preview"
      className="bg-white shadow-lg mx-auto"
      style={{
        width: '794px',
        minHeight: '1123px',
        padding: template.spacing.pagePadding,
        fontFamily: template.font.body,
        color: template.colors.text,
        fontSize: template.font.sizes.body,
        ...(templateId === 'modern' ? { borderTop: `4px solid ${template.colors.accent}` } : {}),
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: `1.5px solid ${template.colors.divider}`,
          paddingBottom: template.spacing.itemGap,
          marginBottom: template.spacing.sectionGap,
        }}
      >
        <div style={{ flex: 1 }}>
          <h1
            className="font-bold tracking-wide"
            style={{
              fontFamily: template.font.heading,
              fontSize: template.font.sizes.name,
              color: template.colors.primary,
              marginBottom: '0.25rem',
              letterSpacing: templateId === 'classic' ? '0.08em' : templateId === 'modern' ? '-0.01em' : '0.02em',
            }}
          >
            <EditableText text={pinfo.name || ''} onSave={(v) => update(['personalInfo', 'name'], v)} inline />
          </h1>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              columnGap: '0.85rem',
              rowGap: '0.15rem',
              fontSize: template.font.sizes.small,
              color: template.colors.muted,
            }}
          >
            {[pinfo.phone, pinfo.email, pinfo.location, ...(pinfo.other || [])]
              .filter(Boolean)
              .map((item: string, i: number, arr: string[]) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {item.startsWith('http') ? (
                    <EditableText
                      text={item}
                      onSave={(v) => {
                        const others = [...(pinfo.other || [])];
                        const oi = others.findIndex((o: string) => o.startsWith('http'));
                        if (oi >= 0) others[oi] = v;
                        update(['personalInfo', 'other'], others);
                      }}
                      inline
                    />
                  ) : item === pinfo.phone ? (
                    <EditableText text={item} onSave={(v) => update(['personalInfo', 'phone'], v)} inline />
                  ) : item === pinfo.email ? (
                    <EditableText text={item} onSave={(v) => update(['personalInfo', 'email'], v)} inline />
                  ) : item === pinfo.location ? (
                    <EditableText text={item} onSave={(v) => update(['personalInfo', 'location'], v)} inline />
                  ) : (
                    <EditableText text={item} onSave={(v) => {
                      const others = [...(pinfo.other || [])];
                      const oi = others.indexOf(item);
                      if (oi >= 0) others[oi] = v;
                      update(['personalInfo', 'other'], others);
                    }} inline />
                  )}
                  {i < arr.length - 1 && (
                    <span style={{ color: template.colors.divider, userSelect: 'none' }}>|</span>
                  )}
                </span>
              ))}
          </div>
        </div>

        {photoUrl && (
          <div style={{ flexShrink: 0, marginLeft: '1.25rem' }}>
            <img
              src={photoUrl}
              alt="证件照"
              style={{
                width: '95px',
                height: '125px',
                objectFit: 'cover',
                borderRadius: templateId === 'modern' ? '4px' : '2px',
                border: templateId === 'classic' ? '1px solid #ddd' : 'none',
              }}
            />
          </div>
        )}
      </div>

      {/* Sections */}
      {visibleSections.map((section: any, si: number) => (
        <div key={section.id} style={{ marginBottom: template.spacing.sectionGap }}>
          {/* Section title */}
          <h2
            style={{
              fontFamily: template.font.heading,
              fontSize: template.font.sizes.sectionTitle,
              fontWeight: 700,
              color: template.colors.primary,
              borderBottom: `1px solid ${template.colors.divider}`,
              paddingBottom: '0.2rem',
              marginBottom: template.spacing.itemGap,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              letterSpacing: templateId === 'classic' ? '0.06em' : '0.03em',
            }}
          >
            <SectionIcon type={section.type} />
            {section.title}
          </h2>

          {section.type === 'skills' ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem 1rem', lineHeight: 1.7 }}>
              {(section.items || []).map((skillItem: any, skillIdx: number) => (
                <span key={skillItem.id || skillIdx} style={{ fontSize: template.font.sizes.body, color: template.colors.text }}>
                  <EditableText text={skillItem.name || ''} onSave={(v) => update(['sections', si, 'items', skillIdx, 'name'], v)} inline />
                  {skillIdx < (section.items || []).length - 1 && (
                    <span style={{ color: template.colors.muted, marginLeft: '0.1rem' }}>、</span>
                  )}
                </span>
              ))}
            </div>
          ) : section.type === 'work_experience' ? (
            <div>
              {section.items.map((item: any, idx: number) => (
                <WorkExperienceItem key={item.id || idx} item={{ ...item, _idx: idx }} template={template} sectionId={section.id} idx={si} update={update} />
              ))}
            </div>
          ) : section.type === 'education' ? (
            <div>
              {section.items.map((item: any, idx: number) => (
                <EducationItem key={item.id || idx} item={{ ...item, _idx: idx }} template={template} sectionId={section.id} idx={si} update={update} />
              ))}
            </div>
          ) : section.type === 'self_evaluation' ? (
            <div style={{ fontSize: template.font.sizes.body, lineHeight: 1.7, color: template.colors.text }}>
              {(section.items[0]?.bullets as string[])?.map((bullet: string, bi: number) => (
                <p key={bi} style={{ marginBottom: '0.15rem', textIndent: '2em' }}>
                  <EditableText text={bullet} onSave={(v) => update(['sections', si, 'items', 0, 'bullets', bi], v)} />
                </p>
              ))}
            </div>
          ) : section.type === 'projects' ? (
            <div>
              {section.items.map((item: any, idx: number) => (
                <div key={item.id || idx} style={{ marginBottom: template.spacing.itemGap }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                      <span style={{ fontWeight: 600, fontSize: template.font.sizes.body, color: template.colors.primary }}>
                        <EditableText text={item.name || ''} onSave={(v) => update(['sections', si, 'items', idx, 'name'], v)} inline />
                      </span>
                      {item.role && (
                        <>
                          <span style={{ color: template.colors.muted, fontSize: template.font.sizes.small }}>|</span>
                          <span style={{ fontSize: template.font.sizes.body, color: template.colors.muted }}>
                            <EditableText text={item.role || ''} onSave={(v) => update(['sections', si, 'items', idx, 'role'], v)} inline />
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {(item.bullets as string[])?.map((bullet: string, bi: number) => (
                    <div key={bi} style={{ display: 'flex', gap: '0.4rem', marginTop: 1, fontSize: template.font.sizes.body, lineHeight: 1.65 }}>
                      <span style={{ color: template.colors.accent, flexShrink: 0, fontWeight: 700 }}>·</span>
                      <EditableText text={bullet} onSave={(v) => update(['sections', si, 'items', idx, 'bullets', bi], v)} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            /* certificates / other */
            <div>
              {section.items.map((item: any, idx: number) => (
                <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontSize: template.font.sizes.body }}>
                  <span style={{ color: template.colors.text }}>
                    <EditableText text={item.name || ''} onSave={(v) => update(['sections', si, 'items', idx, 'name'], v)} inline />
                  </span>
                  {item.date && (
                    <span style={{ color: template.colors.muted, fontSize: template.font.sizes.small }}>
                      <EditableText text={item.date || ''} onSave={(v) => update(['sections', si, 'items', idx, 'date'], v)} inline />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

import type { ResumeTemplate } from '../types';

export const modernTemplate: ResumeTemplate = {
  id: 'modern',
  name: '现代模板',
  font: {
    heading: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
    body: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
    sizes: {
      name: '28pt',
      sectionTitle: '12pt',
      body: '10pt',
      small: '9pt',
    },
  },
  colors: {
    primary: '#0f3b5e',
    accent: '#2b7bd6',
    text: '#1e293b',
    muted: '#5e6f82',
    divider: '#dce3ea',
    background: '#ffffff',
  },
  spacing: {
    sectionGap: '1.25rem',
    itemGap: '0.65rem',
    pagePadding: '2rem 2.5rem',
  },
  layout: 'single-column',
  showPhoto: false,
  dateFormat: 'YYYY.MM - YYYY.MM',
};

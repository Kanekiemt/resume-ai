import type { ResumeTemplate } from '../types';

export const compactTemplate: ResumeTemplate = {
  id: 'compact',
  name: '紧凑模板',
  font: {
    heading: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
    body: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
    sizes: {
      name: '20pt',
      sectionTitle: '11pt',
      body: '9.5pt',
      small: '8.5pt',
    },
  },
  colors: {
    primary: '#111111',
    accent: '#444444',
    text: '#2a2a2a',
    muted: '#5c5c5c',
    divider: '#cccccc',
    background: '#ffffff',
  },
  spacing: {
    sectionGap: '0.45rem',
    itemGap: '0.3rem',
    pagePadding: '1.25rem 1.5rem',
  },
  layout: 'single-column',
  showPhoto: false,
  dateFormat: 'YYYY.MM - YYYY.MM',
};

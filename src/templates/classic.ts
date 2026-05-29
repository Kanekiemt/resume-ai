import type { ResumeTemplate } from '../types';

export const classicTemplate: ResumeTemplate = {
  id: 'classic',
  name: '经典模板',
  font: {
    heading: '"Noto Serif SC", "SimSun", "STSong", serif',
    body: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
    sizes: {
      name: '26pt',
      sectionTitle: '13pt',
      body: '10.5pt',
      small: '9pt',
    },
  },
  colors: {
    primary: '#1a1a1a',
    accent: '#8b1a1a',
    text: '#2d2d2d',
    muted: '#6b6b6b',
    divider: '#c4a882',
    background: '#ffffff',
  },
  spacing: {
    sectionGap: '0.85rem',
    itemGap: '0.5rem',
    pagePadding: '2.25rem 2.5rem',
  },
  layout: 'single-column',
  showPhoto: false,
  dateFormat: 'YYYY.MM - YYYY.MM',
};

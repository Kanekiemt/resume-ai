export interface BasicInfo {
  name: string;
  phone: string;
  email: string;
  location: string;
  website?: string;
  github?: string;
  wechat?: string;
}

export interface EducationEntry {
  id: string;
  school: string;
  degree: string;
  major: string;
  startYear: string;
  endYear: string;
  description?: string;
}

export interface WorkExperienceEntry {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights?: string[];
}

export interface SkillEntry {
  id: string;
  name: string;
  level: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  role: string;
  description: string;
  highlights?: string[];
  url?: string;
}

export interface PersonalInfo {
  basicInfo: BasicInfo;
  education: EducationEntry[];
  workExperience: WorkExperienceEntry[];
  skills: SkillEntry[];
  projects: ProjectEntry[];
}

export interface JobInput {
  companyName: string;
  positionTitle: string;
  jobDescription: string;
}

export interface JobApplication {
  id: string;
  createdAt: string;
  jobInput: JobInput;
  generatedResult?: TailoredResume;
}

export interface ResumeSectionItem {
  id: string;
  [key: string]: string | string[] | undefined;
}

export interface ResumeSectionData {
  id: string;
  title: string;
  visible: boolean;
  items: ResumeSectionItem[];
  type: 'work_experience' | 'education' | 'skills' | 'projects' | 'certificates';
}

export interface TailoredResume {
  selfIntroduction: string;
  sections: ResumeSectionData[];
  keywords: string[];
}

export interface ResumeTemplate {
  id: string;
  name: string;
  font: {
    heading: string;
    body: string;
    sizes: Record<string, string>;
  };
  colors: {
    primary: string;
    accent: string;
    text: string;
    muted: string;
    divider: string;
    background: string;
  };
  spacing: {
    sectionGap: string;
    itemGap: string;
    pagePadding: string;
  };
  layout: 'single-column' | 'two-column';
  showPhoto: boolean;
  dateFormat: 'YYYY.MM' | 'YYYY.MM - YYYY.MM' | 'YYYY年MM月';
}

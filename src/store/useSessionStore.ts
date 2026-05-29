import { create } from 'zustand';

interface SessionState {
  resumeText: string;
  resumeFileName: string;
  jobText: string;
  jobUrl: string;
  positionTitle: string;
  companyName: string;
  photoPreview: string;
  setResume: (text: string, fileName: string) => void;
  setResumeText: (text: string) => void;
  setResumeFileName: (name: string) => void;
  setJobText: (text: string) => void;
  setJobUrl: (url: string) => void;
  setPositionTitle: (title: string) => void;
  setCompanyName: (name: string) => void;
  setPhoto: (dataUrl: string) => void;
  clearAll: () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  resumeText: '',
  resumeFileName: '',
  jobText: '',
  jobUrl: '',
  positionTitle: '',
  companyName: '',
  photoPreview: '',
  setResume: (text, fileName) => set({ resumeText: text, resumeFileName: fileName }),
  setResumeText: (text) => set({ resumeText: text }),
  setResumeFileName: (name) => set({ resumeFileName: name }),
  setJobText: (text) => set({ jobText: text }),
  setJobUrl: (url) => set({ jobUrl: url }),
  setPositionTitle: (title) => set({ positionTitle: title }),
  setCompanyName: (name) => set({ companyName: name }),
  setPhoto: (dataUrl) => set({ photoPreview: dataUrl }),
  clearAll: () => set({ resumeText: '', resumeFileName: '', jobText: '', jobUrl: '', positionTitle: '', companyName: '', photoPreview: '' }),
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_KEY = '';

interface SettingsState {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: DEFAULT_KEY,
      setApiKey: (key: string) => set({ apiKey: key }),
    }),
    { name: 'resume_settings' }
  )
);

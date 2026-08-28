import { create } from 'zustand';
import { THEMES } from '../constants';

export type ThemeType = 'spotify';

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  COLORS: typeof THEMES.spotify;
}

export const useThemeStore = create<ThemeState>()(
  (set) => ({
    theme: 'spotify',
    COLORS: THEMES.spotify,
    setTheme: (theme: ThemeType) => set({ theme, COLORS: THEMES[theme] }),
  })
);

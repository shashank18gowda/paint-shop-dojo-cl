import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "dark" | "light";
export type FontSize = "sm" | "md" | "lg" | "xl";

const FONT_PX: Record<FontSize, string> = {
  sm: "13px",
  md: "16px",
  lg: "19px",
  xl: "22px",
};

const THEME_TOKENS: Record<Theme, { bg: string; color: string }> = {
  dark:  { bg: "#0a0a0a", color: "#ffffff" },
  light: { bg: "#f0f0f0", color: "#0a0a0a" },
};

export function applyToDOM(theme: Theme, fontSize: FontSize) {
  const root = document.documentElement;
  const { bg, color } = THEME_TOKENS[theme];
  root.style.fontSize = FONT_PX[fontSize];
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-font-size", fontSize);
  document.body.style.background = bg;
  document.body.style.color = color;
}

interface SettingsState {
  theme: Theme;
  fontSize: FontSize;
  setTheme: (theme: Theme) => void;
  setFontSize: (fontSize: FontSize) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      fontSize: "md",
      setTheme: (theme) => {
        set({ theme });
        applyToDOM(theme, get().fontSize);
      },
      setFontSize: (fontSize) => {
        set({ fontSize });
        applyToDOM(get().theme, fontSize);
      },
    }),
    {
      name: "settings",
      onRehydrateStorage: () => (state) => {
        if (state) applyToDOM(state.theme, state.fontSize);
      },
    }
  )
);
// Continuous theme, ported from the IP-tracker (TypeScript -> plain JS).
//   mode      0-100  : light -> dark, blended smoothly via CSS color-mix(--mode)
//   inversion 0-100  : color inversion for accessibility (filter on the shell)
//   blueLight 0-100  : warm night overlay (reduces blue light)
// All three persist to localStorage so the choice follows you across pages.

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();
const KEY = 'protasker-theme';
const DEFAULT = { mode: 0, inversion: 0, blueLight: 0 };
const clamp = (v) => Math.min(100, Math.max(0, Number(v) || 0));

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (!saved) return DEFAULT;
      const parsed = JSON.parse(saved);
      return {
        mode: clamp(parsed.mode),
        inversion: clamp(parsed.inversion),
        blueLight: clamp(parsed.blueLight),
      };
    } catch {
      return DEFAULT;
    }
  });

  // persist
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(theme)); } catch { /* ignore */ }
  }, [theme]);

  // push --mode onto <html> so every color-mix() token re-blends as you drag
  useEffect(() => {
    document.documentElement.style.setProperty('--mode', `${theme.mode}%`);
  }, [theme.mode]);

  const setMode = useCallback((v) => setTheme((t) => ({ ...t, mode: clamp(v) })), []);
  const setInversion = useCallback((v) => setTheme((t) => ({ ...t, inversion: clamp(v) })), []);
  const setBlueLight = useCallback((v) => setTheme((t) => ({ ...t, blueLight: clamp(v) })), []);

  return (
    <ThemeContext.Provider value={{ theme, setMode, setInversion, setBlueLight }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

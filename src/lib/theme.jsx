import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Theme system.
 *
 * Dark is the default PAKSH theme. The chosen theme is written to
 * localStorage under `paksh-theme` and mirrored onto <html data-theme>, which
 * is what the CSS token blocks key off. The initial value is applied by the
 * inline script in index.html before first paint; this module keeps React in
 * sync afterwards and follows the system preference only while the user has
 * not chosen a theme themselves.
 */

export const THEME_KEY = 'paksh-theme';
export const THEMES = { DARK: 'dark', LIGHT: 'light' };

const ThemeContext = createContext({
  theme: THEMES.DARK,
  setTheme: () => {},
  toggleTheme: () => {},
  hasPreference: false
});

function isTheme(value) {
  return value === THEMES.DARK || value === THEMES.LIGHT;
}

export function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function systemTheme() {
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? THEMES.LIGHT
      : THEMES.DARK;
  } catch {
    return THEMES.DARK;
  }
}

/** Apply a theme to the document (tokens, native form controls, browser chrome). */
export function applyTheme(theme) {
  const next = isTheme(theme) ? theme : THEMES.DARK;
  const root = document.documentElement;
  root.setAttribute('data-theme', next);
  root.style.colorScheme = next;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', next === THEMES.LIGHT ? '#f6f8fb' : '#05070d');
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const fromDom = document.documentElement.getAttribute('data-theme');
    if (isTheme(fromDom)) return fromDom;
    return readStoredTheme() || systemTheme();
  });
  const [hasPreference, setHasPreference] = useState(() => Boolean(readStoredTheme()));

  // Keep the DOM in sync with React state (covers programmatic changes).
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Follow the OS only while the user has made no explicit choice.
  useEffect(() => {
    let media;
    try {
      media = window.matchMedia('(prefers-color-scheme: light)');
    } catch {
      return undefined;
    }
    const onChange = (event) => {
      if (hasPreference) return;
      setThemeState(event.matches ? THEMES.LIGHT : THEMES.DARK);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [hasPreference]);

  const setTheme = useCallback((next) => {
    const value = isTheme(next) ? next : THEMES.DARK;
    setThemeState(value);
    setHasPreference(true);
    applyTheme(value);
    try {
      window.localStorage.setItem(THEME_KEY, value);
    } catch {
      // Private mode / storage disabled — the theme still applies for this visit.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT);
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, hasPreference }),
    [theme, setTheme, toggleTheme, hasPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Read a themed accent (e.g. `--a-cyan`) for canvas or SVG drawing. */
export function readAccent(name, fallback = '#22d3ee') {
  if (typeof window === 'undefined') return fallback;
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

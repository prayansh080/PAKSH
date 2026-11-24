import { Moon, Sun } from 'lucide-react';
import { useTheme, THEMES } from '../lib/theme';

/**
 * ThemeToggle — sun/moon switch for the light and dark themes.
 *
 * A plain button (not a fake switch role) with an explicit accessible name,
 * so keyboard and screen-reader users get the current state and the action.
 */
export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === THEMES.LIGHT;
  const label = isLight ? 'Switch to dark theme' : 'Switch to light theme';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`icon-btn theme-toggle ${className}`}
      aria-label={label}
      title={label}
      data-theme-state={theme}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {isLight ? <Sun /> : <Moon />}
      </span>
      <span className="sr-only">{label}</span>
    </button>
  );
}

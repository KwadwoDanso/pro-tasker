import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const TRACK_MODE  = 'linear-gradient(to right, #ffffff 0%, #94a3b8 50%, #050507 100%)';
const TRACK_INV   = 'linear-gradient(to right, #10b981 0%, #6366f1 50%, #ef4444 100%)';
const TRACK_NIGHT = 'linear-gradient(to right, #fde68a 0%, #f59e0b 50%, #92400e 100%)';

export default function ThemeControls() {
  const { theme, setMode, setInversion, setBlueLight } = useTheme();
  const [open, setOpen] = useState(false);
  const modeLabel = theme.mode < 25 ? 'Light' : theme.mode < 75 ? 'Mid' : 'Dark';

  return (
    <div className="theme-wrap">
      <button
        type="button"
        className="theme-trigger"
        aria-expanded={open}
        aria-label="Display preferences"
        onClick={() => setOpen((o) => !o)}
      >
        Display
      </button>

      {open && (
        <div className="theme-card" role="region" aria-label="Display preferences">
          <div className="theme-row">
            <div className="theme-row__label"><span>Theme</span><span>{modeLabel} · {Math.round(theme.mode)}%</span></div>
            <input
              type="range" min="0" max="100" step="1" value={theme.mode}
              onChange={(e) => setMode(Number(e.target.value))}
              className="slider" style={{ background: TRACK_MODE }}
              aria-label="Theme mode from light to dark"
            />
          </div>
          <div className="theme-row">
            <div className="theme-row__label"><span>Invert</span><span>{theme.inversion}%</span></div>
            <input
              type="range" min="0" max="100" step="1" value={theme.inversion}
              onChange={(e) => setInversion(Number(e.target.value))}
              className="slider" style={{ background: TRACK_INV }}
              aria-label="Color inversion percentage for accessibility"
            />
          </div>
          <div className="theme-row">
            <div className="theme-row__label"><span>Night</span><span>{theme.blueLight}%</span></div>
            <input
              type="range" min="0" max="100" step="1" value={theme.blueLight}
              onChange={(e) => setBlueLight(Number(e.target.value))}
              className="slider" style={{ background: TRACK_NIGHT }}
              aria-label="Night mode warmth intensity"
            />
          </div>
        </div>
      )}
    </div>
  );
}

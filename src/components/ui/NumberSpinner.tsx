// src/components/ui/NumberSpinner.tsx
import React from "react";

interface NumberSpinnerProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  min?: number;
  max?: number;
  step?: number;          // ✅ NEW
  disabled?: boolean;
}

function clamp(n: number, min?: number, max?: number) {
  let out = n;
  if (min !== undefined) out = Math.max(min, out);
  if (max !== undefined) out = Math.min(max, out);
  return out;
}

const NumberSpinner: React.FC<NumberSpinnerProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,              // ✅ NEW (default)
  disabled,
}) => {
  const parsed = Number(value);
  const numericValue = Number.isFinite(parsed) ? parsed : (min ?? 0);

  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;

  const setNumber = (next: number) => {
    if (disabled) return;
    onChange(String(clamp(next, min, max)));
  };

  const adjust = (dir: -1 | 1) => setNumber(numericValue + dir * safeStep);

  // Optional: press-and-hold repeat
  const repeatTimerRef = React.useRef<number | null>(null);
  const repeatIntervalRef = React.useRef<number | null>(null);

  const stopRepeat = () => {
    if (repeatTimerRef.current !== null) {
      window.clearTimeout(repeatTimerRef.current);
      repeatTimerRef.current = null;
    }
    if (repeatIntervalRef.current !== null) {
      window.clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  };

  const startRepeat = (dir: -1 | 1) => {
    if (disabled) return;
    adjust(dir);

    stopRepeat();

    // start repeating after a short delay
    repeatTimerRef.current = window.setTimeout(() => {
      repeatIntervalRef.current = window.setInterval(() => adjust(dir), 90);
    }, 250);
  };

  React.useEffect(() => stopRepeat, []);

  const decDisabled = disabled || (min !== undefined && numericValue <= min);
  const incDisabled = disabled || (max !== undefined && numericValue >= max);

  return (
    <div className="bb-number-spinner">
      {label && <div className="bb-number-spinner__label">{label}</div>}

      <div className="bb-number-spinner__row">
        <button
          type="button"
          className="bb-number-spinner__btn"
          onMouseDown={() => startRepeat(-1)}
          onMouseUp={stopRepeat}
          onMouseLeave={stopRepeat}
          onTouchStart={() => startRepeat(-1)}
          onTouchEnd={stopRepeat}
          disabled={decDisabled}
          aria-label={`Decrease ${label ?? "value"} by ${safeStep}`}
        >
          −
        </button>

        <input
          type="number"
          className="bb-number-spinner__input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) {
              onChange(String(clamp(min ?? 0, min, max)));
            } else {
              onChange(String(clamp(n, min, max)));
            }
          }}
          min={min}
          max={max}
          step={safeStep}     // ✅ NEW (helps native steppers, if shown)
          disabled={disabled}
          inputMode="numeric"
          pattern="[0-9]*"
        />

        <button
          type="button"
          className="bb-number-spinner__btn"
          onMouseDown={() => startRepeat(+1)}
          onMouseUp={stopRepeat}
          onMouseLeave={stopRepeat}
          onTouchStart={() => startRepeat(+1)}
          onTouchEnd={stopRepeat}
          disabled={incDisabled}
          aria-label={`Increase ${label ?? "value"} by ${safeStep}`}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default NumberSpinner;
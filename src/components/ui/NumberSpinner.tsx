// src/components/ui/NumberSpinner.tsx
import React from "react";

interface NumberSpinnerProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const NumberSpinner: React.FC<NumberSpinnerProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  disabled,
}) => {
  const adjust = (delta: number) => {
    if (disabled) return; // don't modify when disabled
    const n = Number(value) || 0;
    let next = n + delta;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChange(String(next));
  };

  return (
    <div>
      {label && <label>{label}</label>}
      <div style={{ position: "relative" }}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          disabled={disabled}
          style={{ width: "100%", paddingRight: "1.6rem" }}
        />
        <div className="bb-spinner">
          <button
            type="button"
            className="bb-spinner-btn"
            onClick={() => adjust(+1)}
            disabled={disabled}
          >
            ▲
          </button>
          <button
            type="button"
            className="bb-spinner-btn"
            onClick={() => adjust(-1)}
            disabled={disabled}
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
};

export default NumberSpinner;
import { ChangeEvent } from 'react';
import './Slider.css';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  description?: string;
}

export function Slider({ label, value, min, max, step, onChange, description }: SliderProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="slider-wrapper">
      <div className="slider-header">
        <label className="slider-label">{label}</label>
        <span className="slider-value">{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range"
        className="slider"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        style={{ '--slider-percentage': `${percentage}%` } as React.CSSProperties}
      />
      <div className="slider-range">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {description && <p className="slider-description">{description}</p>}
    </div>
  );
}

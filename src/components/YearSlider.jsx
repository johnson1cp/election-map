import { PRESIDENTIAL_YEARS } from '../utils/constants';

export default function YearSlider({ year, onChange, years = PRESIDENTIAL_YEARS }) {
  const idx = years.indexOf(year);

  return (
    <div className="year-slider">
      <button
        className="year-btn"
        onClick={() => idx > 0 && onChange(years[idx - 1])}
        disabled={idx <= 0}
      >
        ◀
      </button>
      <input
        type="range"
        min={0}
        max={years.length - 1}
        value={idx >= 0 ? idx : 0}
        onChange={(e) => onChange(years[parseInt(e.target.value)])}
        className="slider-input"
      />
      <button
        className="year-btn"
        onClick={() => idx < years.length - 1 && onChange(years[idx + 1])}
        disabled={idx >= years.length - 1}
      >
        ▶
      </button>
      <div className="year-labels">
        {years.map((y) => (
          <span
            key={y}
            className={`year-label ${y === year ? 'active' : ''}`}
            onClick={() => onChange(y)}
          >
            {y}
          </span>
        ))}
      </div>
    </div>
  );
}

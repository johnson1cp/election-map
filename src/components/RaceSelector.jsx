import { RACE_TYPES } from '../utils/constants';

const raceLabels = {
  [RACE_TYPES.PRESIDENT]: 'President',
  [RACE_TYPES.SENATE]: 'Senate',
  [RACE_TYPES.HOUSE]: 'House',
  [RACE_TYPES.GOVERNOR]: 'Governor',
};

export default function RaceSelector({ selected, onChange }) {
  return (
    <div className="race-selector">
      {Object.entries(raceLabels).map(([key, label]) => (
        <button
          key={key}
          className={`race-btn ${selected === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
          disabled={key !== RACE_TYPES.PRESIDENT} // Only presidential data available in Phase 1
        >
          {label}
        </button>
      ))}
    </div>
  );
}

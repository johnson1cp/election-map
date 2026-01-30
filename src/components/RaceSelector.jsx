import { RACE_TYPES } from '../utils/constants';

const raceLabels = {
  [RACE_TYPES.PRESIDENT]: 'President',
  [RACE_TYPES.SENATE]: 'Senate',
  [RACE_TYPES.HOUSE]: 'House',
  [RACE_TYPES.GOVERNOR]: 'Governor',
};

export default function RaceSelector({ selected, onChange, isPredictionYear = false }) {
  const isDisabled = (key) => {
    // President, Senate, and House are implemented
    return key !== RACE_TYPES.PRESIDENT && key !== RACE_TYPES.SENATE && key !== RACE_TYPES.HOUSE;
  };

  return (
    <div className="race-selector">
      {Object.entries(raceLabels).map(([key, label]) => (
        <button
          key={key}
          className={`race-btn ${selected === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
          disabled={isDisabled(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

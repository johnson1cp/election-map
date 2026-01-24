import { STATE_NAMES } from '../utils/constants';

export default function InfoPanel({ year, selectedState, results, stateData, onBack }) {
  if (!results || !year) return null;

  const yearData = results[year];
  if (!yearData) return null;

  // State detail view
  if (selectedState && yearData.states?.[selectedState]) {
    const state = yearData.states[selectedState];
    const countyData = stateData?.[selectedState]?.[year]?.counties;
    const countyCount = countyData ? Object.keys(countyData).length : 0;

    return (
      <div className="info-panel">
        <button className="back-btn" onClick={onBack}>← Back to National</button>
        <h2>{STATE_NAMES[selectedState] || selectedState}</h2>
        <h3>{year} Presidential</h3>
        <div className="candidates">
          <div className={`candidate ${state.winner === 'DEM' ? 'winner' : ''}`}>
            <span className="party dem">D</span>
            <span className="name">{state.dem_candidate}</span>
            <span className="pct">{state.dem_pct?.toFixed(1)}%</span>
            <span className="votes">{state.dem_votes?.toLocaleString()}</span>
          </div>
          <div className={`candidate ${state.winner === 'REP' ? 'winner' : ''}`}>
            <span className="party rep">R</span>
            <span className="name">{state.rep_candidate}</span>
            <span className="pct">{state.rep_pct?.toFixed(1)}%</span>
            <span className="votes">{state.rep_votes?.toLocaleString()}</span>
          </div>
        </div>
        <div className="margin-display">
          Margin: <strong>{state.winner === 'DEM' ? 'D' : 'R'}+{Math.abs(state.margin)?.toFixed(1)}%</strong>
        </div>
        {countyCount > 0 && (
          <div className="county-count">{countyCount} counties shown</div>
        )}
      </div>
    );
  }

  // National overview
  const states = yearData.states || {};
  const demStates = Object.values(states).filter((s) => s.winner === 'DEM').length;
  const repStates = Object.values(states).filter((s) => s.winner === 'REP').length;
  const totalDem = Object.values(states).reduce((sum, s) => sum + (s.dem_votes || 0), 0);
  const totalRep = Object.values(states).reduce((sum, s) => sum + (s.rep_votes || 0), 0);

  return (
    <div className="info-panel">
      <h2>{year} Presidential Election</h2>
      <div className="candidates">
        <div className={`candidate ${totalDem > totalRep ? 'winner' : ''}`}>
          <span className="party dem">D</span>
          <span className="name">{yearData.candidates?.dem}</span>
          <span className="votes">{totalDem.toLocaleString()} votes</span>
          <span className="states-won">{demStates} states</span>
        </div>
        <div className={`candidate ${totalRep > totalDem ? 'winner' : ''}`}>
          <span className="party rep">R</span>
          <span className="name">{yearData.candidates?.rep}</span>
          <span className="votes">{totalRep.toLocaleString()} votes</span>
          <span className="states-won">{repStates} states</span>
        </div>
      </div>
      <div className="instruction">Click a state to see county results</div>
    </div>
  );
}

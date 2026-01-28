import { STATE_NAMES, getElectoralVotes } from '../utils/constants';

export default function InfoPanel({ year, selectedState, results, stateData, onBack }) {
  if (!results || !year) return null;

  const yearData = results[year];
  if (!yearData) return null;

  // State detail view
  if (selectedState && yearData.states?.[selectedState]) {
    const state = yearData.states[selectedState];
    const countyData = stateData?.[selectedState]?.[year]?.counties;
    const countyCount = countyData ? Object.keys(countyData).length : 0;
    const ev = getElectoralVotes(selectedState, year);
    const totalVotes = (state.dem_votes || 0) + (state.rep_votes || 0);

    // Build candidates array sorted by winner first
    const candidates = [
      { party: 'REP', name: state.rep_candidate, votes: state.rep_votes, pct: state.rep_pct, isWinner: state.winner === 'REP' },
      { party: 'DEM', name: state.dem_candidate, votes: state.dem_votes, pct: state.dem_pct, isWinner: state.winner === 'DEM' },
    ].sort((a, b) => b.isWinner - a.isWinner);

    return (
      <div className="info-panel">
        <button className="back-btn" onClick={onBack}>← Back to National</button>
        <div className="state-header">
          <h2>{STATE_NAMES[selectedState] || selectedState}, Pres.</h2>
          <span className={`held-badge ${state.winner === 'DEM' ? 'dem' : 'rep'}`}>
            {state.winner === 'DEM' ? 'DEM' : 'GOP'} held
          </span>
        </div>
        <div className="ev-subheader">{ev} electoral votes</div>

        <div className="results-table">
          <div className="table-header">
            <span className="col-check"></span>
            <span className="col-name"></span>
            <span className="col-votes">Votes</span>
            <span className="col-pct">Pct.</span>
          </div>
          {candidates.map((c) => (
            <div key={c.party} className={`table-row ${c.isWinner ? 'winner ' + c.party.toLowerCase() : ''}`}>
              <span className="col-check">{c.isWinner ? '✓' : '○'}</span>
              <span className="col-name">
                {c.name} <span className="party-label">({c.party === 'DEM' ? 'D' : 'R'})</span>
              </span>
              <span className="col-votes">{c.votes?.toLocaleString()}</span>
              <span className="col-pct">{c.pct?.toFixed(1)}</span>
            </div>
          ))}
          <div className="table-row total-row">
            <span className="col-check"></span>
            <span className="col-name">Total</span>
            <span className="col-votes">{totalVotes.toLocaleString()}</span>
            <span className="col-pct"></span>
          </div>
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

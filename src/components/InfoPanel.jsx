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
  const stateAbbrs = Object.keys(states);

  // Calculate electoral votes by summing EVs from states each candidate won
  const demEV = stateAbbrs.reduce((sum, abbr) =>
    sum + (states[abbr].winner === 'DEM' ? getElectoralVotes(abbr, year) : 0), 0);
  const repEV = stateAbbrs.reduce((sum, abbr) =>
    sum + (states[abbr].winner === 'REP' ? getElectoralVotes(abbr, year) : 0), 0);

  const totalDem = Object.values(states).reduce((sum, s) => sum + (s.dem_votes || 0), 0);
  const totalRep = Object.values(states).reduce((sum, s) => sum + (s.rep_votes || 0), 0);
  const totalVotes = totalDem + totalRep;
  const demPct = totalVotes > 0 ? (totalDem / totalVotes) * 100 : 0;
  const repPct = totalVotes > 0 ? (totalRep / totalVotes) * 100 : 0;

  const repWins = repEV > demEV;

  // Build candidates array sorted by winner first
  const candidates = [
    { party: 'REP', name: yearData.candidates?.rep, votes: totalRep, pct: repPct, ev: repEV, isWinner: repWins },
    { party: 'DEM', name: yearData.candidates?.dem, votes: totalDem, pct: demPct, ev: demEV, isWinner: !repWins },
  ].sort((a, b) => b.isWinner - a.isWinner);

  return (
    <div className="info-panel">
      <div className="state-header">
        <h2>{year} Presidential</h2>
        <span className={`held-badge ${repWins ? 'rep' : 'dem'}`}>
          {repWins ? 'GOP' : 'DEM'} wins
        </span>
      </div>
      <div className="ev-subheader">
        270 to win • <span className="rep-text">{repEV} (R)</span> <span className="dem-text">{demEV} (D)</span>
      </div>

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

      <div className="instruction">Click a state to see county results</div>
    </div>
  );
}

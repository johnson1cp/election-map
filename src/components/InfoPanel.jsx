import { STATE_NAMES, getElectoralVotes, RACE_TYPES } from '../utils/constants';

// States that had 2024 Senate races
const SENATE_STATES_2024 = new Set([
  'AZ', 'CA', 'CT', 'DE', 'FL', 'HI', 'IN', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO',
  'MT', 'NE', 'NV', 'NJ', 'NM', 'NY', 'ND', 'OH', 'PA', 'RI', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY'
]);

export default function InfoPanel({ year, raceType, selectedState, selectedCounty, results, stateData, onBack, onClearCounty, isPredictionYear = false, onBackToResults, onSwitchToPresident }) {
  if (!results || !year) return null;

  const yearData = results[year];
  if (!yearData) return null;

  const isSenate = raceType === RACE_TYPES.SENATE;
  const raceLabel = isSenate ? 'Senate' : 'Pres.';

  // Handle prediction years differently
  if (isPredictionYear) {
    return renderPredictionPanel(yearData, selectedState, onBack, year, onBackToResults);
  }

  // Check if state has a Senate race in 2024
  if (isSenate && selectedState && !SENATE_STATES_2024.has(selectedState)) {
    return (
      <div className="info-panel">
        <button className="back-btn" onClick={onBack}>← Back to National</button>
        <div className="state-header">
          <h2>{STATE_NAMES[selectedState] || selectedState}</h2>
        </div>
        <div className="no-race-message">
          No Senate race in 2024
        </div>
        <div className="instruction">This state did not have a Senate election in 2024.</div>
      </div>
    );
  }

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

    // County data if selected
    const countyResult = selectedCounty?.fips && countyData?.[selectedCounty.fips];
    let countyCandidates = null;
    let countyTotalVotes = 0;
    if (countyResult) {
      countyTotalVotes = (countyResult.dem_votes || 0) + (countyResult.rep_votes || 0);
      const countyWinner = countyResult.dem_pct > countyResult.rep_pct ? 'DEM' : 'REP';
      countyCandidates = [
        { party: 'REP', votes: countyResult.rep_votes, pct: countyResult.rep_pct, isWinner: countyWinner === 'REP' },
        { party: 'DEM', votes: countyResult.dem_votes, pct: countyResult.dem_pct, isWinner: countyWinner === 'DEM' },
      ].sort((a, b) => b.isWinner - a.isWinner);
    }

    return (
      <div className="info-panel">
        <button className="back-btn" onClick={onBack}>← Back to National</button>
        <div className="state-header">
          <h2>{STATE_NAMES[selectedState] || selectedState}, {raceLabel}</h2>
          <span className={`held-badge ${state.winner === 'DEM' ? 'dem' : 'rep'}`}>
            {state.winner === 'DEM' ? 'DEM' : 'GOP'} {isSenate ? 'wins' : 'held'}
          </span>
        </div>
        {!isSenate && <div className="ev-subheader">{ev} electoral votes</div>}

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

        {countyCount > 0 && !selectedCounty && (
          <div className="county-count">{countyCount} counties • click for detail</div>
        )}

        {countyCandidates && (
          <div className="county-detail">
            <div className="county-header">
              <h3>{selectedCounty.name} County</h3>
              <button className="clear-county-btn" onClick={onClearCounty}>×</button>
            </div>
            <div className="results-table">
              <div className="table-header">
                <span className="col-check"></span>
                <span className="col-name"></span>
                <span className="col-votes">Votes</span>
                <span className="col-pct">Pct.</span>
              </div>
              {countyCandidates.map((c) => (
                <div key={c.party} className={`table-row ${c.isWinner ? 'winner ' + c.party.toLowerCase() : ''}`}>
                  <span className="col-check">{c.isWinner ? '✓' : '○'}</span>
                  <span className="col-name">
                    <span className="party-label">({c.party === 'DEM' ? 'D' : 'R'})</span>
                  </span>
                  <span className="col-votes">{c.votes?.toLocaleString()}</span>
                  <span className="col-pct">{c.pct?.toFixed(1)}</span>
                </div>
              ))}
              <div className="table-row total-row">
                <span className="col-check"></span>
                <span className="col-name">Total</span>
                <span className="col-votes">{countyTotalVotes.toLocaleString()}</span>
                <span className="col-pct"></span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // National overview
  const states = yearData.states || {};
  const stateAbbrs = Object.keys(states);

  // For Senate races, use summary data if available
  const senateSummary = isSenate ? yearData.summary : null;

  // Calculate electoral votes by summing EVs from states each candidate won (presidential)
  const demEV = stateAbbrs.reduce((sum, abbr) =>
    sum + (states[abbr].winner === 'DEM' ? getElectoralVotes(abbr, year) : 0), 0);
  const repEV = stateAbbrs.reduce((sum, abbr) =>
    sum + (states[abbr].winner === 'REP' ? getElectoralVotes(abbr, year) : 0), 0);

  // Count seats won for Senate
  const demSeatsWon = senateSummary?.dem_seats_won || stateAbbrs.filter(abbr => states[abbr].winner === 'DEM').length;
  const repSeatsWon = senateSummary?.rep_seats_won || stateAbbrs.filter(abbr => states[abbr].winner === 'REP').length;
  const demSeatsTotal = senateSummary?.dem_seats_total || 47;
  const repSeatsTotal = senateSummary?.rep_seats_total || 53;

  const totalDem = Object.values(states).reduce((sum, s) => sum + (s.dem_votes || 0), 0);
  const totalRep = Object.values(states).reduce((sum, s) => sum + (s.rep_votes || 0), 0);
  const totalVotes = totalDem + totalRep;
  const demPct = totalVotes > 0 ? (totalDem / totalVotes) * 100 : 0;
  const repPct = totalVotes > 0 ? (totalRep / totalVotes) * 100 : 0;

  const repWins = isSenate ? repSeatsTotal > demSeatsTotal : repEV > demEV;

  // Build candidates array sorted by winner first
  const candidates = [
    { party: 'REP', name: yearData.candidates?.rep, votes: totalRep, pct: repPct, ev: repEV, isWinner: repWins },
    { party: 'DEM', name: yearData.candidates?.dem, votes: totalDem, pct: demPct, ev: demEV, isWinner: !repWins },
  ].sort((a, b) => b.isWinner - a.isWinner);

  return (
    <div className="info-panel">
      {isSenate && onSwitchToPresident && (
        <button className="back-btn" onClick={onSwitchToPresident}>← Back to President</button>
      )}
      <div className="state-header">
        <h2>{year} {isSenate ? 'Senate' : 'Presidential'}</h2>
        <span className={`held-badge ${repWins ? 'rep' : 'dem'}`}>
          {repWins ? 'GOP' : 'DEM'} {isSenate ? 'majority' : 'wins'}
        </span>
      </div>
      {isSenate ? (
        <div className="ev-subheader">
          51 for majority • <span className="rep-text">{repSeatsTotal} (R)</span> <span className="dem-text">{demSeatsTotal} (D)</span>
        </div>
      ) : (
        <div className="ev-subheader">
          270 to win • <span className="rep-text">{repEV} (R)</span> <span className="dem-text">{demEV} (D)</span>
        </div>
      )}

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

// Render prediction panel for 2026 midterms
function renderPredictionPanel(yearData, selectedState, onBack, year, onBackToResults) {
  const states = yearData.states || {};
  const summary = yearData.summary || {};

  // State detail view for predictions
  if (selectedState && states[selectedState]) {
    const state = states[selectedState];
    const probDem = state.prob_dem;
    const probRep = state.prob_rep;
    const leader = probDem > probRep ? 'DEM' : probRep > probDem ? 'REP' : null;

    return (
      <div className="info-panel">
        <button className="back-btn" onClick={onBack}>← Back to National</button>
        <div className="state-header">
          <h2>{STATE_NAMES[selectedState] || selectedState}, Senate</h2>
          <span className="prediction-badge">Projected</span>
        </div>
        <div className="ev-subheader">
          {state.classification} • Incumbent: {state.incumbent_party === 'DEM' ? 'D' : 'R'}
          {state.seat_change_d !== 0 && (
            <span className={state.seat_change_d > 0 ? 'dem-text' : 'rep-text'}>
              {' '}• Potential flip
            </span>
          )}
        </div>

        <div className="results-table">
          <div className="table-header">
            <span className="col-check"></span>
            <span className="col-name"></span>
            <span className="col-votes"></span>
            <span className="col-pct">Prob.</span>
          </div>
          <div className={`table-row ${leader === 'DEM' ? 'winner dem' : ''}`}>
            <span className="col-check">{leader === 'DEM' ? '↑' : ''}</span>
            <span className="col-name">
              Democrat <span className="party-label">(D)</span>
            </span>
            <span className="col-votes"></span>
            <span className="col-pct">{probDem}%</span>
          </div>
          <div className={`table-row ${leader === 'REP' ? 'winner rep' : ''}`}>
            <span className="col-check">{leader === 'REP' ? '↑' : ''}</span>
            <span className="col-name">
              Republican <span className="party-label">(R)</span>
            </span>
            <span className="col-votes"></span>
            <span className="col-pct">{probRep}%</span>
          </div>
        </div>

        <div className="instruction prediction-source">
          Probabilities from Kalshi prediction markets
        </div>
      </div>
    );
  }

  // National overview for predictions
  const projectedDem = summary.projected_dem_seats || 50;
  const projectedRep = summary.projected_rep_seats || 50;
  const racesUp = summary.races_up || Object.keys(states).length;
  const tossups = summary.tossups || Object.values(states).filter(s => s.classification === 'Toss-up').length;

  // Count by classification
  const safeDem = Object.values(states).filter(s => s.classification === 'Safe D').length;
  const likelyDem = Object.values(states).filter(s => s.classification === 'Likely D').length;
  const leanDem = Object.values(states).filter(s => s.classification === 'Lean D').length;
  const safeRep = Object.values(states).filter(s => s.classification === 'Safe R').length;
  const likelyRep = Object.values(states).filter(s => s.classification === 'Likely R').length;
  const leanRep = Object.values(states).filter(s => s.classification === 'Lean R').length;

  const repLeads = projectedRep > projectedDem;

  return (
    <div className="info-panel">
      {onBackToResults && (
        <button className="back-btn" onClick={onBackToResults}>← Back to 2024 Results</button>
      )}
      <div className="state-header">
        <h2>{year} Senate Midterms</h2>
        <span className="prediction-badge">Projected</span>
      </div>
      <div className="ev-subheader">
        51 for majority • <span className="rep-text">{projectedRep} (R)</span> <span className="dem-text">{projectedDem} (D)</span>
      </div>

      <div className="results-table prediction-summary">
        <div className="table-header">
          <span className="col-name">Rating</span>
          <span className="col-pct">D</span>
          <span className="col-pct">R</span>
        </div>
        <div className="table-row">
          <span className="col-name">Safe</span>
          <span className="col-pct dem-text">{safeDem}</span>
          <span className="col-pct rep-text">{safeRep}</span>
        </div>
        <div className="table-row">
          <span className="col-name">Likely</span>
          <span className="col-pct dem-text">{likelyDem}</span>
          <span className="col-pct rep-text">{likelyRep}</span>
        </div>
        <div className="table-row">
          <span className="col-name">Lean</span>
          <span className="col-pct dem-text">{leanDem}</span>
          <span className="col-pct rep-text">{leanRep}</span>
        </div>
        <div className="table-row">
          <span className="col-name">Toss-up</span>
          <span className="col-pct" style={{ textAlign: 'center' }} colSpan="2">{tossups}</span>
          <span className="col-pct"></span>
        </div>
        <div className="table-row total-row">
          <span className="col-name">Races</span>
          <span className="col-pct" style={{ textAlign: 'center' }} colSpan="2">{racesUp}</span>
          <span className="col-pct"></span>
        </div>
      </div>

      <div className="instruction">Click a state for race details</div>
      <div className="instruction prediction-source">
        Probabilities from Kalshi prediction markets
      </div>
    </div>
  );
}

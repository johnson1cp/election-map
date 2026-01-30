import { STATE_NAMES, getElectoralVotes, RACE_TYPES } from '../utils/constants';

// States that had 2024 Senate races
const SENATE_STATES_2024 = new Set([
  'AZ', 'CA', 'CT', 'DE', 'FL', 'HI', 'IN', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO',
  'MT', 'NE', 'NV', 'NJ', 'NM', 'NY', 'ND', 'OH', 'PA', 'RI', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY'
]);

export default function InfoPanel({ year, raceType, selectedState, selectedCounty, selectedDistrict, results, stateData, onBack, onClearCounty, onClearDistrict, isPredictionYear = false, onBackToResults, onSwitchToPresident, onDistrictClick }) {
  if (!results || !year) return null;

  const yearData = results[year];
  if (!yearData) return null;

  const isSenate = raceType === RACE_TYPES.SENATE;
  const isHouse = raceType === RACE_TYPES.HOUSE;
  const raceLabel = isSenate ? 'Senate' : isHouse ? 'House' : 'Pres.';

  // Handle prediction years differently
  if (isPredictionYear) {
    return renderPredictionPanel(yearData, selectedState, onBack, year, onBackToResults);
  }

  // Handle House races
  if (isHouse) {
    return renderHousePanel(yearData, onSwitchToPresident, year, selectedState, selectedDistrict, onBack, onClearDistrict, onDistrictClick);
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

// Render House panel
function renderHousePanel(yearData, onSwitchToPresident, year, selectedState, selectedDistrict, onBack, onClearDistrict, onDistrictClick) {
  const summary = yearData.summary || {};
  const districts = yearData.districts || {};

  const demSeats = summary.dem_seats || 0;
  const repSeats = summary.rep_seats || 0;
  const totalSeats = summary.total_seats || 435;
  const repWins = repSeats > demSeats;

  // State view with district list
  if (selectedState) {
    // Filter districts for this state
    const stateDistricts = Object.entries(districts)
      .filter(([id, d]) => d.state === selectedState)
      .sort((a, b) => {
        const numA = parseInt(a[0].substring(2), 10);
        const numB = parseInt(b[0].substring(2), 10);
        return numA - numB;
      });

    const stateDemSeats = stateDistricts.filter(([, d]) => d.winner === 'DEM').length;
    const stateRepSeats = stateDistricts.filter(([, d]) => d.winner === 'REP').length;
    const stateDemVotes = stateDistricts.reduce((sum, [, d]) => sum + (d.dem_votes || 0), 0);
    const stateRepVotes = stateDistricts.reduce((sum, [, d]) => sum + (d.rep_votes || 0), 0);
    const stateTotalVotes = stateDemVotes + stateRepVotes;

    // Get selected district data if any
    const selectedDistrictData = selectedDistrict ? districts[selectedDistrict] : null;

    return (
      <div className="info-panel">
        <button className="back-btn" onClick={onBack}>← Back to National</button>
        <div className="state-header">
          <h2>{STATE_NAMES[selectedState] || selectedState}, House</h2>
          <span className={`held-badge ${stateRepSeats > stateDemSeats ? 'rep' : 'dem'}`}>
            {stateRepSeats > stateDemSeats ? 'GOP' : 'DEM'} {stateRepSeats === stateDemSeats ? 'tie' : 'leads'}
          </span>
        </div>
        <div className="ev-subheader">
          {stateDistricts.length} district{stateDistricts.length !== 1 ? 's' : ''} •
          <span className="rep-text"> {stateRepSeats} R</span>
          <span className="dem-text"> {stateDemSeats} D</span>
        </div>

        <div className="district-list-container">
          <div className="results-table district-list">
            <div className="table-header">
              <span className="col-district">Dist.</span>
              <span className="col-winner">Winner</span>
              <span className="col-margin">Margin</span>
            </div>
            {stateDistricts.map(([id, d]) => {
              const districtNum = parseInt(id.substring(2), 10);
              const winnerName = d.winner === 'DEM' ? d.dem_candidate :
                                 d.winner === 'REP' ? d.rep_candidate :
                                 d.other_candidates?.find(c => c.isWinner)?.name || 'Unknown';
              const winnerClass = d.winner === 'DEM' ? 'dem' : d.winner === 'REP' ? 'rep' : 'ind';
              const isSelected = id === selectedDistrict;
              return (
                <div
                  key={id}
                  className={`table-row district-row ${winnerClass} ${isSelected ? 'selected' : ''}`}
                  onClick={() => onDistrictClick?.(id, selectedState)}
                >
                  <span className="col-district">{districtNum || 'AL'}</span>
                  <span className="col-winner">
                    {formatCandidateName(winnerName)}
                    <span className="party-label"> ({getPartyLabel(d.winner)})</span>
                  </span>
                  <span className={`col-margin ${winnerClass}-text`}>
                    {getPartyLabel(d.winner)}+{Math.abs(d.margin).toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="state-vote-summary">
          Total votes: {stateTotalVotes.toLocaleString()} •
          <span className="rep-text"> R {(stateRepVotes / stateTotalVotes * 100).toFixed(1)}%</span>
          <span className="dem-text"> D {(stateDemVotes / stateTotalVotes * 100).toFixed(1)}%</span>
        </div>

        {/* District detail section - shown below state summary when district selected */}
        {selectedDistrictData && renderDistrictDetail(selectedDistrictData, selectedDistrict, onClearDistrict)}
      </div>
    );
  }

  // National view
  const totalDem = Object.values(districts).reduce((sum, d) => sum + (d.dem_votes || 0), 0);
  const totalRep = Object.values(districts).reduce((sum, d) => sum + (d.rep_votes || 0), 0);
  const totalVotes = totalDem + totalRep;
  const demPct = totalVotes > 0 ? (totalDem / totalVotes * 100) : 0;
  const repPct = totalVotes > 0 ? (totalRep / totalVotes * 100) : 0;

  return (
    <div className="info-panel">
      {onSwitchToPresident && (
        <button className="back-btn" onClick={onSwitchToPresident}>← Back to President</button>
      )}
      <div className="state-header">
        <h2>{year} House</h2>
        <span className={`held-badge ${repWins ? 'rep' : 'dem'}`}>
          {repWins ? 'GOP' : 'DEM'} majority
        </span>
      </div>
      <div className="ev-subheader">
        218 for majority • <span className="rep-text">{repSeats} (R)</span> <span className="dem-text">{demSeats} (D)</span>
      </div>

      <div className="results-table">
        <div className="table-header">
          <span className="col-check"></span>
          <span className="col-name"></span>
          <span className="col-votes">Votes</span>
          <span className="col-pct">Pct.</span>
        </div>
        <div className={`table-row ${repWins ? 'winner rep' : ''}`}>
          <span className="col-check">{repWins ? '✓' : '○'}</span>
          <span className="col-name">
            Republicans <span className="party-label">(R)</span>
          </span>
          <span className="col-votes">{totalRep.toLocaleString()}</span>
          <span className="col-pct">{repPct.toFixed(1)}</span>
        </div>
        <div className={`table-row ${!repWins ? 'winner dem' : ''}`}>
          <span className="col-check">{!repWins ? '✓' : '○'}</span>
          <span className="col-name">
            Democrats <span className="party-label">(D)</span>
          </span>
          <span className="col-votes">{totalDem.toLocaleString()}</span>
          <span className="col-pct">{demPct.toFixed(1)}</span>
        </div>
        <div className="table-row total-row">
          <span className="col-check"></span>
          <span className="col-name">Total</span>
          <span className="col-votes">{totalVotes.toLocaleString()}</span>
          <span className="col-pct"></span>
        </div>
      </div>

      <div className="instruction">Click a state for district results</div>
    </div>
  );
}

// Render district detail section (shown below state summary)
function renderDistrictDetail(d, districtId, onClearDistrict) {
  const districtNum = parseInt(districtId.substring(2), 10);
  const districtLabel = districtNum === 0 ? 'At-Large' : `District ${districtNum}`;
  const totalVotes = d.total_votes || (d.dem_votes + d.rep_votes);

  // Build candidates array, filtering out null/zero candidates
  const candidates = [];
  if (d.rep_candidate && d.rep_votes > 0) {
    candidates.push({ party: 'REP', name: d.rep_candidate, votes: d.rep_votes, pct: d.rep_pct, isWinner: d.winner === 'REP' });
  }
  if (d.dem_candidate && d.dem_votes > 0) {
    candidates.push({ party: 'DEM', name: d.dem_candidate, votes: d.dem_votes, pct: d.dem_pct, isWinner: d.winner === 'DEM' });
  }
  // Add other/independent candidates if present
  if (d.other_candidates && Array.isArray(d.other_candidates)) {
    d.other_candidates.forEach(c => {
      candidates.push({
        party: c.party || 'IND',
        name: c.name,
        votes: c.votes,
        pct: c.pct,
        isWinner: c.isWinner || false
      });
    });
  } else if (d.other_votes && d.other_votes > 0) {
    const otherPct = totalVotes > 0 ? (d.other_votes / totalVotes * 100) : 0;
    candidates.push({ party: 'OTH', name: 'Other', votes: d.other_votes, pct: otherPct, isWinner: false });
  }
  // Sort by votes descending (winner first)
  candidates.sort((a, b) => (b.votes || 0) - (a.votes || 0));

  const winnerClass = d.winner === 'DEM' ? 'dem' : d.winner === 'REP' ? 'rep' : 'ind';

  return (
    <div className="district-detail">
      <div className="district-detail-header">
        <h3>{d.state}-{districtNum || 'AL'}: {districtLabel}</h3>
        <button className="clear-county-btn" onClick={onClearDistrict}>×</button>
      </div>
      <div className={`district-winner ${winnerClass}`}>
        {getPartyLabel(d.winner)}+{Math.abs(d.margin).toFixed(1)}%
      </div>

      <div className="results-table">
        <div className="table-header">
          <span className="col-check"></span>
          <span className="col-name"></span>
          <span className="col-votes">Votes</span>
          <span className="col-pct">Pct.</span>
        </div>
        {candidates.map((c, idx) => (
          <div key={c.party + idx} className={`table-row ${c.isWinner ? 'winner ' + c.party.toLowerCase() : ''}`}>
            <span className="col-check">{c.isWinner ? '✓' : '○'}</span>
            <span className="col-name">
              {formatCandidateName(c.name)} <span className="party-label">({getPartyLabel(c.party)})</span>
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
    </div>
  );
}

// Format candidate name from "LAST NAME" or "FIRST LAST" to "F. Last"
function formatCandidateName(name) {
  if (!name) return '';
  const parts = name.split(' ').filter(p => p.length > 0);
  if (parts.length === 0) return '';
  if (parts.length === 1) {
    // Single word - assume last name, title case it
    return parts[0].charAt(0) + parts[0].slice(1).toLowerCase();
  }
  // Multiple words - use first initial + last name
  const lastName = parts[parts.length - 1];
  const firstInitial = parts[0].charAt(0);
  return `${firstInitial}. ${lastName.charAt(0)}${lastName.slice(1).toLowerCase()}`;
}

// Get party label (D, R, I, L, G, etc.)
function getPartyLabel(party) {
  if (!party) return '?';
  const labels = {
    'DEM': 'D',
    'REP': 'R',
    'IND': 'I',
    'LIB': 'L',
    'LIBERTARIAN': 'L',
    'GRN': 'G',
    'GREEN': 'G',
    'OTH': 'O',
    'OTHER': 'O',
    'NPP': 'I', // No Party Preference
    'NPA': 'I', // No Party Affiliation
  };
  return labels[party.toUpperCase()] || party.charAt(0);
}

export default function Tooltip({ data, position }) {
  if (!data || !position) return null;

  const { name, result } = data;

  // Build candidates list, sorted by votes
  let candidates = [];
  if (result) {
    // Handle NV House county data with pre-built candidates array
    if (result.isHouseCounty && result.candidates) {
      candidates = result.candidates.map(c => ({
        party: c.party,
        name: c.name,
        votes: c.votes,
        pct: c.pct,
      }));
    } else {
      if (result.dem_candidate && result.dem_votes > 0) {
        candidates.push({ party: 'DEM', name: result.dem_candidate, votes: result.dem_votes, pct: result.dem_pct });
      }
      if (result.rep_candidate && result.rep_votes > 0) {
        candidates.push({ party: 'REP', name: result.rep_candidate, votes: result.rep_votes, pct: result.rep_pct });
      }
      // Add other candidates if present
      if (result.other_candidates) {
        result.other_candidates.forEach(c => {
          candidates.push({ party: c.party || 'IND', name: c.name, votes: c.votes, pct: c.pct });
        });
      }
      // Sort by votes descending
      candidates.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    }
  }

  // Fallback for races with only D/R (no other_candidates array)
  if (result && candidates.length === 0) {
    candidates.push({ party: 'DEM', name: result.dem_candidate || 'Democrat', votes: result.dem_votes, pct: result.dem_pct });
    candidates.push({ party: 'REP', name: result.rep_candidate || 'Republican', votes: result.rep_votes, pct: result.rep_pct });
  }

  const getPartyClass = (party) => {
    if (party === 'DEM') return 'dem';
    if (party === 'REP') return 'rep';
    return 'oth';
  };

  const getPartyLabel = (party) => {
    const labels = { 'DEM': 'D', 'REP': 'R', 'IND': 'I', 'LIB': 'L', 'GRN': 'G', 'LIBERTARIAN': 'L', 'GREEN': 'G' };
    return labels[party] || party?.charAt(0) || '?';
  };

  const formatName = (name) => {
    if (!name) return '';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length <= 1) return name;
    const lastName = parts[parts.length - 1];
    return parts[0].charAt(0) + '. ' + lastName.charAt(0) + lastName.slice(1).toLowerCase();
  };

  const winnerParty = result?.winner || (candidates[0]?.party);
  const winnerLabel = getPartyLabel(winnerParty);

  return (
    <div
      className="tooltip"
      style={{
        left: position.x + 12,
        top: position.y - 10,
      }}
    >
      <div className="tooltip-title">
        {result?.isHouseCounty ? `${result.countyName} County` : name}
        {result?.electoralVotes && (
          <span className="tooltip-ev">{result.electoralVotes} EV</span>
        )}
      </div>
      {result && candidates.length > 0 && (
        <div className="tooltip-content">
          {candidates.slice(0, 4).map((c, i) => (
            <div key={i} className={`tooltip-row ${getPartyClass(c.party)}`}>
              <span className="tooltip-candidate">{formatName(c.name)} ({getPartyLabel(c.party)})</span>
              <span className="tooltip-pct">{c.pct?.toFixed(1)}%</span>
            </div>
          ))}
          <div className={`tooltip-margin ${getPartyClass(winnerParty)}`}>
            {winnerLabel}+{Math.abs(result.margin)?.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}

export default function Tooltip({ data, position }) {
  if (!data || !position) return null;

  const { name, result } = data;

  const voteMargin = result
    ? Math.abs((result.dem_votes || 0) - (result.rep_votes || 0))
    : 0;

  return (
    <div
      className="tooltip"
      style={{
        left: position.x + 12,
        top: position.y - 10,
      }}
    >
      <div className="tooltip-title">
        {name}
        {result?.electoralVotes && (
          <span className="tooltip-ev">{result.electoralVotes} EV</span>
        )}
      </div>
      {result && (
        <div className="tooltip-content">
          <div className="tooltip-row dem">
            <span className="tooltip-candidate">{result.dem_candidate || 'Democrat'}</span>
            <span className="tooltip-pct">{result.dem_pct?.toFixed(1)}%</span>
            <span className="tooltip-votes">{(result.dem_votes || 0).toLocaleString()}</span>
          </div>
          <div className="tooltip-row rep">
            <span className="tooltip-candidate">{result.rep_candidate || 'Republican'}</span>
            <span className="tooltip-pct">{result.rep_pct?.toFixed(1)}%</span>
            <span className="tooltip-votes">{(result.rep_votes || 0).toLocaleString()}</span>
          </div>
          <div className={`tooltip-margin ${result.winner === 'DEM' ? 'dem' : 'rep'}`}>
            {result.winner === 'DEM' ? 'D' : 'R'}+{Math.abs(result.margin)?.toFixed(1)}%
            ({voteMargin.toLocaleString()} votes)
          </div>
        </div>
      )}
    </div>
  );
}

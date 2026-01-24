import { getLegendStops } from '../utils/colorScale';

export default function MapLegend() {
  const stops = getLegendStops();

  return (
    <div className="map-legend">
      <div className="legend-bar">
        {stops.map((stop, i) => (
          <div
            key={i}
            className="legend-stop"
            style={{ backgroundColor: stop.color }}
          />
        ))}
      </div>
      <div className="legend-labels">
        <span>R+40</span>
        <span>R+20</span>
        <span>Even</span>
        <span>D+20</span>
        <span>D+40</span>
      </div>
    </div>
  );
}

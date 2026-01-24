import { scaleLinear } from 'd3-scale';
import { PARTIES } from './constants';

// Red → Purple → Blue gradient
const DEM_COLORS = ['#8a5a9a', '#7466a8', '#5e78b8', '#4a8ecc', '#2a6db8', '#1a4a8a'];
const REP_COLORS = ['#9a5a8a', '#a85a6e', '#b85050', '#cc3a3a', '#b02018', '#8a1005'];
const PURPLE = '#8856a7';
const NO_DATA = '#555555';

const demScale = scaleLinear()
  .domain([0, 3, 8, 15, 25, 40])
  .range(DEM_COLORS)
  .clamp(true);

const repScale = scaleLinear()
  .domain([0, 3, 8, 15, 25, 40])
  .range(REP_COLORS)
  .clamp(true);

export function getMarginColor(margin, winner) {
  if (margin === null || margin === undefined || !winner) {
    return NO_DATA;
  }
  if (Math.abs(margin) < 0.5) {
    return PURPLE;
  }
  if (winner === PARTIES.DEM) {
    return demScale(Math.abs(margin));
  }
  if (winner === PARTIES.REP) {
    return repScale(Math.abs(margin));
  }
  return PURPLE;
}

export function getResultColor(result) {
  if (!result) return NO_DATA;
  const { dem_pct, rep_pct } = result;
  if (dem_pct == null || rep_pct == null) return NO_DATA;
  const margin = dem_pct - rep_pct;
  const winner = margin > 0 ? PARTIES.DEM : PARTIES.REP;
  return getMarginColor(Math.abs(margin), winner);
}

export function getLegendStops() {
  const stops = [];
  for (let m = -40; m <= 40; m += 2) {
    const winner = m > 0 ? PARTIES.DEM : PARTIES.REP;
    stops.push({
      margin: m,
      color: getMarginColor(Math.abs(m), m === 0 ? null : winner),
    });
  }
  return stops;
}

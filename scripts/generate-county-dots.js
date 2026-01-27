import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { feature } from 'topojson-client';
import { geoCentroid } from 'd3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Read counties TopoJSON and convert to GeoJSON
const countiesTopology = JSON.parse(
  readFileSync(resolve(root, 'public/data/geo/us-counties.json'), 'utf-8')
);
const countiesGeojson = feature(countiesTopology, countiesTopology.objects.counties);

// Read all state election data and build lookup by county FIPS
const statesDir = resolve(root, 'public/data/results/presidential/states');
const countyElectionData = {};

for (const file of readdirSync(statesDir).filter(f => f.endsWith('.json'))) {
  const stateData = JSON.parse(readFileSync(resolve(statesDir, file), 'utf-8'));
  for (const [year, yearData] of Object.entries(stateData)) {
    if (!yearData.counties) continue;
    for (const [fips, result] of Object.entries(yearData.counties)) {
      if (!countyElectionData[fips]) countyElectionData[fips] = {};
      countyElectionData[fips][`y${year}_total`] = result.total_votes;
      countyElectionData[fips][`y${year}_margin`] = result.margin;
      countyElectionData[fips][`y${year}_winner`] = result.winner;
    }
  }
}

// Build GeoJSON FeatureCollection of Point features at county centroids
const features = [];
for (const county of countiesGeojson.features) {
  const fips = String(county.id).padStart(5, '0');
  const stateFips = fips.slice(0, 2);
  const centroid = geoCentroid(county);

  if (!isFinite(centroid[0]) || !isFinite(centroid[1])) continue;

  features.push({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: centroid,
    },
    properties: {
      fips,
      name: county.properties?.name || '',
      state_fips: stateFips,
      ...(countyElectionData[fips] || {}),
    },
  });
}

const output = { type: 'FeatureCollection', features };

writeFileSync(
  resolve(root, 'public/data/results/presidential/county-dots.json'),
  JSON.stringify(output)
);
console.log(`Generated county-dots.json with ${features.length} features`);

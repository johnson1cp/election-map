#!/usr/bin/env node
/**
 * Creates Nevada county GeoJSON and transforms House county vote data
 */

const fs = require('fs');
const path = require('path');
const topojson = require('topojson-client');

// Nevada FIPS code to county name mapping
const NV_FIPS = {
  '32001': 'Churchill',
  '32003': 'Clark',
  '32005': 'Douglas',
  '32007': 'Elko',
  '32009': 'Esmeralda',
  '32011': 'Eureka',
  '32013': 'Humboldt',
  '32015': 'Lander',
  '32017': 'Lincoln',
  '32019': 'Lyon',
  '32021': 'Mineral',
  '32023': 'Nye',
  '32027': 'Pershing',
  '32029': 'Storey',
  '32031': 'Washoe',
  '32033': 'White Pine',
  '32510': 'Carson City'
};

// County to district mapping based on 2024 data
const COUNTY_TO_DISTRICT = {
  // District 1 - Clark County (part)
  // District 2 - Rural NV + Washoe
  'Carson City': 'NV02',
  'Churchill': 'NV02',
  'Douglas': 'NV02',
  'Elko': 'NV02',
  'Eureka': 'NV02',
  'Humboldt': 'NV02',
  'Lander': 'NV02',
  'Lyon': ['NV02', 'NV04'], // Split between districts
  'Pershing': 'NV02',
  'Storey': 'NV02',
  'Washoe': 'NV02',
  'White Pine': 'NV02',
  // District 3 - Clark County (part)
  // District 4 - Rural + Clark (part)
  'Clark': ['NV01', 'NV03', 'NV04'],
  'Esmeralda': 'NV04',
  'Lincoln': 'NV04',
  'Mineral': 'NV04',
  'Nye': 'NV04'
};

// 1. Create Nevada counties GeoJSON from US counties TopoJSON
function createNVCountiesGeoJSON() {
  const usCounties = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../public/data/geo/us-counties.json'), 'utf8')
  );

  // Filter to Nevada counties only
  const nvGeometries = usCounties.objects.counties.geometries.filter(
    g => g.id && g.id.startsWith('32')
  );

  // Create a new TopoJSON with just NV counties
  const nvTopo = {
    type: 'Topology',
    bbox: usCounties.bbox,
    transform: usCounties.transform,
    objects: {
      counties: {
        type: 'GeometryCollection',
        geometries: nvGeometries
      }
    },
    arcs: usCounties.arcs
  };

  // Convert to GeoJSON
  const nvGeoJSON = topojson.feature(nvTopo, nvTopo.objects.counties);

  // Add FIPS and district info to properties
  nvGeoJSON.features.forEach(f => {
    const fips = f.id;
    const countyName = NV_FIPS[fips];
    f.properties.fips = fips;
    f.properties.name = countyName;
    f.properties.state = 'NV';
    f.properties.districts = COUNTY_TO_DISTRICT[countyName] || null;
  });

  return nvGeoJSON;
}

// 2. Parse the CSV data into structured format
// Data structure from CSV (manually transcribed since we can't fetch dynamically)
const NV_HOUSE_COUNTY_DATA = {
  2024: {
    'NV01': {
      candidates: [
        { name: 'Dina Titus', party: 'DEM', incumbent: true },
        { name: 'Mark Robertson', party: 'REP', incumbent: false },
        { name: 'Ron Quince', party: 'NPP', incumbent: false },
        { name: 'William Hoge', party: 'IAP', incumbent: false },
        { name: 'David Havlicek', party: 'LPN', incumbent: false },
        { name: 'David Goossen', party: 'NPP', incumbent: false }
      ],
      counties: {
        'Clark': {
          votes: {
            'Dina Titus': 167885,
            'Mark Robertson': 143650,
            'Ron Quince': 3321,
            'William Hoge': 2736,
            'David Havlicek': 2711,
            'David Goossen': 2596
          }
        }
      }
    },
    'NV02': {
      candidates: [
        { name: 'Mark Amodei', party: 'REP', incumbent: true },
        { name: 'Greg Kidd', party: 'IND', incumbent: false },
        { name: 'Lynn Chapman', party: 'IAP', incumbent: false },
        { name: 'Avi Tachiquin', party: 'LPN', incumbent: false }
      ],
      counties: {
        'Carson City': { votes: { 'Mark Amodei': 16112, 'Greg Kidd': 10867, 'Lynn Chapman': 2022, 'Avi Tachiquin': 1062 } },
        'Churchill': { votes: { 'Mark Amodei': 8949, 'Greg Kidd': 3199, 'Lynn Chapman': 506, 'Avi Tachiquin': 309 } },
        'Douglas': { votes: { 'Mark Amodei': 22186, 'Greg Kidd': 9971, 'Lynn Chapman': 1096, 'Avi Tachiquin': 651 } },
        'Elko': { votes: { 'Mark Amodei': 15748, 'Greg Kidd': 3468, 'Lynn Chapman': 1253, 'Avi Tachiquin': 991 } },
        'Eureka': { votes: { 'Mark Amodei': 825, 'Greg Kidd': 112, 'Lynn Chapman': 35, 'Avi Tachiquin': 22 } },
        'Humboldt': { votes: { 'Mark Amodei': 5630, 'Greg Kidd': 1594, 'Lynn Chapman': 259, 'Avi Tachiquin': 268 } },
        'Lander': { votes: { 'Mark Amodei': 1875, 'Greg Kidd': 553, 'Lynn Chapman': 108, 'Avi Tachiquin': 115 } },
        'Lyon': { votes: { 'Mark Amodei': 21137, 'Greg Kidd': 8435, 'Lynn Chapman': 1319, 'Avi Tachiquin': 994 } },
        'Pershing': { votes: { 'Mark Amodei': 1616, 'Greg Kidd': 444, 'Lynn Chapman': 94, 'Avi Tachiquin': 54 } },
        'Storey': { votes: { 'Mark Amodei': 1975, 'Greg Kidd': 776, 'Lynn Chapman': 143, 'Avi Tachiquin': 83 } },
        'Washoe': { votes: { 'Mark Amodei': 120780, 'Greg Kidd': 103987, 'Lynn Chapman': 12724, 'Avi Tachiquin': 11082 } },
        'White Pine': { votes: { 'Mark Amodei': 3085, 'Greg Kidd': 658, 'Lynn Chapman': 225, 'Avi Tachiquin': 186 } }
        // Lincoln has insufficient turnout data
      }
    },
    'NV03': {
      candidates: [
        { name: 'Susie Lee', party: 'DEM', incumbent: true },
        { name: 'Drew Johnson', party: 'REP', incumbent: false }
      ],
      counties: {
        'Clark': {
          votes: {
            'Susie Lee': 191304,
            'Drew Johnson': 181084
          }
        }
      }
    },
    'NV04': {
      candidates: [
        { name: 'Steven Horsford', party: 'DEM', incumbent: true },
        { name: 'John Lee', party: 'REP', incumbent: false },
        { name: 'Russell Best', party: 'IAP', incumbent: false },
        { name: 'Tim Ferreira', party: 'LPN', incumbent: false }
      ],
      counties: {
        'Clark': { votes: { 'Steven Horsford': 165576, 'John Lee': 126638, 'Russell Best': 4328, 'Tim Ferreira': 3938 } },
        'Esmeralda': { votes: { 'Steven Horsford': 68, 'John Lee': 317, 'Russell Best': 9, 'Tim Ferreira': 8 } },
        'Lincoln': { votes: { 'Steven Horsford': 346, 'John Lee': 2008, 'Russell Best': 28, 'Tim Ferreira': 25 } },
        'Lyon': { votes: { 'Steven Horsford': 37, 'John Lee': 179, 'Russell Best': 0, 'Tim Ferreira': 3 } },
        'Mineral': { votes: { 'Steven Horsford': 766, 'John Lee': 1360, 'Russell Best': 60, 'Tim Ferreira': 38 } },
        'Nye': { votes: { 'Steven Horsford': 8133, 'John Lee': 17559, 'Russell Best': 494, 'Tim Ferreira': 288 } }
      }
    }
  }
};

// Transform to a simpler format for the app
function transformCountyData() {
  const result = {};

  for (const [year, districts] of Object.entries(NV_HOUSE_COUNTY_DATA)) {
    result[year] = {};

    for (const [districtId, districtData] of Object.entries(districts)) {
      result[year][districtId] = {
        candidates: districtData.candidates,
        counties: {}
      };

      for (const [countyName, countyData] of Object.entries(districtData.counties)) {
        const votes = countyData.votes;
        const totalVotes = Object.values(votes).reduce((sum, v) => sum + v, 0);

        // Find winner
        let maxVotes = 0;
        let winner = null;
        let winnerParty = null;

        for (const candidate of districtData.candidates) {
          const candidateVotes = votes[candidate.name] || 0;
          if (candidateVotes > maxVotes) {
            maxVotes = candidateVotes;
            winner = candidate.name;
            winnerParty = candidate.party;
          }
        }

        // Build candidate results
        const candidateResults = districtData.candidates.map(c => ({
          name: c.name,
          party: c.party,
          votes: votes[c.name] || 0,
          pct: totalVotes > 0 ? ((votes[c.name] || 0) / totalVotes * 100) : 0,
          isWinner: c.name === winner
        })).sort((a, b) => b.votes - a.votes);

        // Calculate margin
        const topTwo = [...candidateResults].sort((a, b) => b.votes - a.votes);
        const margin = topTwo.length >= 2 ? topTwo[0].pct - topTwo[1].pct : topTwo[0]?.pct || 0;

        result[year][districtId].counties[countyName] = {
          total_votes: totalVotes,
          winner: winnerParty === 'DEM' ? 'DEM' : winnerParty === 'REP' ? 'REP' : 'OTH',
          winner_name: winner,
          margin: winnerParty === 'DEM' ? margin : -margin,
          candidates: candidateResults
        };
      }
    }
  }

  return result;
}

// Main
const nvCountiesGeoJSON = createNVCountiesGeoJSON();
const nvHouseCountyData = transformCountyData();

// Write files
const geoOutPath = path.join(__dirname, '../public/data/geo/nv-counties.json');
const dataOutPath = path.join(__dirname, '../public/data/results/house/nv-county-results.json');

fs.writeFileSync(geoOutPath, JSON.stringify(nvCountiesGeoJSON));
fs.writeFileSync(dataOutPath, JSON.stringify(nvHouseCountyData, null, 2));

console.log(`Created ${geoOutPath} with ${nvCountiesGeoJSON.features.length} counties`);
console.log(`Created ${dataOutPath}`);

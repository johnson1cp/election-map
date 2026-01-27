import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dataDir = resolve(__dirname, 'data');

mkdirSync(resolve(root, 'public/data/results/presidential/states'), { recursive: true });

// ---------------------------------------------------------------------------
// Candidates for all years
// ---------------------------------------------------------------------------
const candidates = {
  1976: { dem: 'Jimmy Carter', rep: 'Gerald Ford' },
  1980: { dem: 'Jimmy Carter', rep: 'Ronald Reagan' },
  1984: { dem: 'Walter Mondale', rep: 'Ronald Reagan' },
  1988: { dem: 'Michael Dukakis', rep: 'George H.W. Bush' },
  1992: { dem: 'Bill Clinton', rep: 'George H.W. Bush' },
  1996: { dem: 'Bill Clinton', rep: 'Bob Dole' },
  2000: { dem: 'Al Gore', rep: 'George W. Bush' },
  2004: { dem: 'John Kerry', rep: 'George W. Bush' },
  2008: { dem: 'Barack Obama', rep: 'John McCain' },
  2012: { dem: 'Barack Obama', rep: 'Mitt Romney' },
  2016: { dem: 'Hillary Clinton', rep: 'Donald Trump' },
  2020: { dem: 'Joe Biden', rep: 'Donald Trump' },
  2024: { dem: 'Kamala Harris', rep: 'Donald Trump' },
};

const allYears = [1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012, 2016, 2020, 2024];
const syntheticYears = [1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004];
const realYears = [2008, 2012, 2016, 2020, 2024];

// ---------------------------------------------------------------------------
// FIPS / state mapping
// ---------------------------------------------------------------------------
const stateFips = {
  AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06',
  CO: '08', CT: '09', DE: '10', DC: '11', FL: '12',
  GA: '13', HI: '15', ID: '16', IL: '17', IN: '18',
  IA: '19', KS: '20', KY: '21', LA: '22', ME: '23',
  MD: '24', MA: '25', MI: '26', MN: '27', MS: '28',
  MO: '29', MT: '30', NE: '31', NV: '32', NH: '33',
  NJ: '34', NM: '35', NY: '36', NC: '37', ND: '38',
  OH: '39', OK: '40', OR: '41', PA: '42', RI: '44',
  SC: '45', SD: '46', TN: '47', TX: '48', UT: '49',
  VT: '50', VA: '51', WA: '53', WV: '54', WI: '55',
  WY: '56',
};

const fipsToState = {};
for (const [abbr, fips] of Object.entries(stateFips)) {
  fipsToState[fips] = abbr;
}

const stateNameToAbbr = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'District of Columbia': 'DC', 'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI',
  'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME',
  'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
  'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE',
  'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM',
  'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX',
  'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
  'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
};

// ---------------------------------------------------------------------------
// CSV parsing helper
// ---------------------------------------------------------------------------
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(v => v.trim());
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = vals[j];
    }
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Parse real county data from CSVs
// countyData[year][fips] = { dem_votes, rep_votes, other_votes, total_votes, county_name }
// ---------------------------------------------------------------------------
const countyData = {};
for (const y of realYears) countyData[y] = {};

// --- 08-16 CSV ---
const csv0816 = parseCSV(
  readFileSync(resolve(dataDir, 'US_County_Level_Presidential_Results_08-16.csv'), 'utf-8')
);
for (const row of csv0816) {
  const fips = String(row.fips_code).padStart(5, '0');
  const name = row.county || '';
  for (const year of [2008, 2012, 2016]) {
    const total = parseInt(row[`total_${year}`]) || 0;
    const dem = parseInt(row[`dem_${year}`]) || 0;
    const gop = parseInt(row[`gop_${year}`]) || 0;
    const oth = parseInt(row[`oth_${year}`]) || 0;
    if (total > 0) {
      countyData[year][fips] = {
        dem_votes: dem,
        rep_votes: gop,
        other_votes: oth,
        total_votes: total,
        county_name: name,
      };
    }
  }
}

// --- 2020 and 2024 CSVs ---
function parse2020Format(filepath, year) {
  const rows = parseCSV(readFileSync(filepath, 'utf-8'));
  for (const row of rows) {
    const fips = String(row.county_fips).padStart(5, '0');
    const dem = Math.round(parseFloat(row.votes_dem)) || 0;
    const gop = Math.round(parseFloat(row.votes_gop)) || 0;
    const total = Math.round(parseFloat(row.total_votes)) || 0;
    const oth = Math.max(0, total - dem - gop);
    const name = row.county_name || '';
    if (total > 0) {
      countyData[year][fips] = {
        dem_votes: dem,
        rep_votes: gop,
        other_votes: oth,
        total_votes: total,
        county_name: name,
      };
    }
  }
}

parse2020Format(resolve(dataDir, '2020_US_County_Level_Presidential_Results.csv'), 2020);
parse2020Format(resolve(dataDir, '2024_US_County_Level_Presidential_Results.csv'), 2024);

console.log('Parsed county data:');
for (const y of realYears) {
  console.log(`  ${y}: ${Object.keys(countyData[y]).length} counties`);
}

// ---------------------------------------------------------------------------
// Synthetic state-level data for 1976–2004 (reused from generate-presidential.js)
// ---------------------------------------------------------------------------
const stateMargins = {
  AL: [-12, -1, -22, -20, -7, -6, -15, -26, -22, -22, -28, -25, -30],
  AK: [-21, -17, -30, -22, -9, -18, -31, -26, -22, -14, -15, -10, -16],
  AZ: [-12, -16, -17, -7, -2, -3, -6, -11, -9, -9, -4, 0.3, -6],
  AR: [2, -1, -22, -14, [5, 10], -5, -5, -10, -20, -24, -27, -28, -32],
  CA: [2, -3, -16, -4, 13, 13, 12, 10, 24, 23, 30, 29, 21],
  CO: [-12, -12, -22, -5, 4, 1, -8, -5, 9, 5, 5, 14, 2],
  CT: [5, -5, -22, -5, 6, 16, 18, 10, 22, 17, 14, 20, 12],
  DE: [3, -3, -20, -12, 6, 10, 13, 8, 25, 19, 11, 19, 10],
  DC: [67, 58, 73, 73, 76, 76, 76, 80, 86, 84, 87, 87, 82],
  FL: [-5, -17, -25, -22, 0.5, -6, -0.01, -5, -3, -1, -1, -3, -13],
  GA: [-4, -12, -20, -16, 0.6, -1, -12, -17, -5, -8, -5, 0.2, -2],
  HI: [3, -2, -12, 10, 9, 18, 18, 9, 45, 43, 32, 29, 19],
  ID: [-21, -27, -40, -26, -15, -20, -39, -38, -25, -32, -32, -33, -38],
  IL: [-3, -7, -12, -2, 13, 17, 12, 10, 25, 17, 17, 17, 7],
  IN: [-9, -16, -24, -20, [-3, -5], -6, -16, -21, -1, -10, -19, -16, -22],
  IA: [-2, -12, -7, [-2, -4], 6, 10, 0.3, -0.7, 10, 6, -9, -8, -13],
  KS: [-7, -14, -28, -13, -5, -15, -21, -25, -15, -22, -21, -15, -22],
  KY: [-1, -1, -20, -12, 3, 1, -15, -20, -16, -23, -30, -26, -32],
  LA: [-3, -3, -22, -9, 5, 12, -8, -15, -19, -17, -20, -19, -24],
  ME: [-8, -12, -22, [-8, -12], 8, 19, 5, 9, 17, 15, 3, 9, 6],
  MD: [3, -3, -18, -8, 14, 16, 17, 13, 25, 26, 26, 33, 24],
  MA: [14, -1, -3, 8, 13, 33, 27, 25, 26, 23, 27, 34, 26],
  MI: [2, -6, -19, -8, 7, 13, 0.2, 3, 16, 9, -0.2, 3, -5],
  MN: [7, -3, -3, 7, 10, 16, 2, 3, 10, 8, 1, 7, 2],
  MS: [-2, -1, -24, -20, [-2, -4], [-5, -6], [-17, -16], [-20, -20], [-14, -12], [-12, -11], [-18, -17], [-17, -16], [-22, -20]],
  MO: [-3, -4, -22, [-3, -5], [0.1, 0.5], 6, -3, -7, -0.1, -10, -19, -15, -20],
  MT: [-1, -8, [-22, -20], [-10, -8], 3, [-3, -4], [-25, -26], [-20, -21], [-2, -3], [-14, -13], [-20, -21], [-16, -17], [-22, -20]],
  NE: [-24, -27, -39, -20, [-11, -12], [-15, -16], [-33, -34], [-33, -34], [-15, -14], [-22, -21], [-25, -26], [-19, -20], [-25, -27]],
  NV: [-4, -16, -27, [-15, -14], [3, 2], [-1, 1], [-4, -3], [-3, -2], [12, 13], [7, 6], [-2, -3], [2, 3], [-3, -4]],
  NH: [-4, -17, [-25, -24], [-4, -3], [5, 6], [10, 11], [1, 2], [1, 2], [10, 9], [6, 5], [0.4, 0.3], [7, 8], [2, 3]],
  NJ: [2, -10, [-22, -21], [-14, -13], [2, 3], [18, 17], [16, 15], [7, 6], [15, 16], [18, 17], [14, 15], [16, 17], [6, 7]],
  NM: [-1, [-10, -9], [-22, -21], [-10, -9], [8, 9], [9, 10], [0.1, 0.2], [1, 0.5], [15, 16], [10, 11], [8, 9], [11, 12], [4, 5]],
  NY: [-4, [-8, -7], [-22, -21], [-4, -3], [16, 17], [29, 30], [25, 26], [18, 19], [27, 28], [28, 29], [22, 23], [23, 24], [12, 13]],
  NC: [-4, [-2, -1], [-24, -23], [-12, -11], [0.6, 0.5], [-5, -4], [-13, -12], [-12, -13], [0.3, 0.4], [-2, -3], [-4, -3], [-1, -2], [-4, -5]],
  ND: [-14, [-24, -23], [-32, -31], [-14, -13], [-4, -3], [-7, -6], [-28, -27], [-27, -28], [-9, -8], [-20, -19], [-36, -35], [-33, -34], [-32, -30]],
  OH: [-1, [-8, -7], [-18, -17], [-12, -11], [2, 1], [6, 7], [-4, -3], [-2, -3], [5, 4], [3, 2], [-8, -9], [-8, -9], [-11, -12]],
  OK: [-12, [-19, -18], [-30, -29], [-22, -21], [-8, -7], [-8, -9], [-22, -21], [-31, -32], [-28, -27], [-34, -33], [-36, -37], [-33, -34], [-36, -38]],
  OR: [2, [-4, -3], [-3, -2], [4, 3], [8, 9], [7, 6], [0.5, 0.4], [4, 5], [16, 17], [12, 11], [11, 12], [16, 17], [8, 9]],
  PA: [-3, [-8, -7], [-7, -6], [-4, -3], [7, 9], [9, 10], [4, 5], [3, 2], [10, 11], [5, 6], [-0.7, -0.8], [1, 2], [-2, -3]],
  RI: [9, [-3, -2], [-4, -3], [12, 11], [14, 13], [26, 25], [29, 30], [21, 20], [28, 27], [27, 26], [16, 15], [21, 20], [15, 14]],
  SC: [-12, [-1, -2], [-24, -23], [-24, -23], [-4, -3], [-6, -5], [-16, -15], [-17, -18], [-9, -8], [-10, -11], [-14, -15], [-12, -11], [-18, -17]],
  SD: [-1, [-16, -15], [-30, -29], [-8, -7], [-3, -4], [-3, -2], [-22, -23], [-22, -21], [-8, -9], [-12, -11], [-30, -29], [-26, -27], [-28, -30]],
  TN: [1, [-1, -2], [-16, -15], [-16, -15], [5, 4], [3, 2], [-4, -3], [-14, -15], [-15, -16], [-20, -21], [-26, -25], [-23, -24], [-28, -30]],
  TX: [-3, [-14, -13], [-27, -26], [-13, -14], [-5, -6], [-5, -4], [-21, -22], [-23, -22], [-12, -11], [-16, -15], [-9, -8], [-6, -5], [-14, -13]],
  UT: [-29, [-46, -45], [-50, -51], [-32, -33], [-12, -11], [-22, -21], [-41, -40], [-46, -45], [-28, -29], [-48, -47], [-18, -19], [-20, -21], [-28, -30]],
  VT: [-14, [-4, -3], [-18, -17], [-8, -7], [16, 15], [13, 12], [10, 9], [20, 19], [37, 36], [36, 35], [26, 27], [36, 35], [27, 28]],
  VA: [-2, [-12, -11], [-24, -23], [-16, -15], [4, 3], [2, 3], [-8, -9], [-8, -7], [6, 7], [4, 3], [5, 6], [10, 11], [0.5, 1]],
  WA: [4, [-5, -4], [-8, -7], [4, 3], [12, 11], [12, 13], [6, 5], [7, 8], [17, 18], [15, 14], [16, 15], [20, 19], [12, 13]],
  WV: [17, [-2, -1], [-12, -11], [-5, -4], [13, 12], [15, 14], [-6, -5], [-13, -12], [-13, -14], [-27, -26], [-42, -43], [-39, -40], [-42, -44]],
  WI: [2, [-5, -4], [-9, -8], [-4, -3], [4, 5], [10, 9], [0.2, 0.3], [0.4, 0.3], [14, 13], [7, 6], [-0.8, -0.7], [0.6, 0.7], [-2, -3]],
  WY: [-12, [-28, -27], [-40, -39], [-20, -19], [-8, -7], [-12, -11], [-40, -41], [-40, -41], [-32, -31], [-41, -40], [-46, -47], [-43, -44], [-44, -46]],
};

const stateVotes = {
  AL: 2300000, AK: 360000, AZ: 3400000, AR: 1200000, CA: 17500000,
  CO: 3300000, CT: 1800000, DE: 500000, DC: 340000, FL: 11100000,
  GA: 5000000, HI: 570000, ID: 870000, IL: 6000000, IN: 3000000,
  IA: 1700000, KS: 1400000, KY: 2100000, LA: 2100000, ME: 820000,
  MD: 3000000, MA: 3600000, MI: 5500000, MN: 3300000, MS: 1300000,
  MO: 3000000, MT: 600000, NE: 960000, NV: 1400000, NH: 810000,
  NJ: 4500000, NM: 920000, NY: 8500000, NC: 5500000, ND: 360000,
  OH: 5900000, OK: 1600000, OR: 2400000, PA: 7000000, RI: 510000,
  SC: 2500000, SD: 420000, TN: 3050000, TX: 11300000, UT: 1500000,
  VT: 370000, VA: 4500000, WA: 4100000, WV: 790000, WI: 3300000,
  WY: 280000,
};

// Approximate county counts per state (for synthetic data only)
const countyCounts = {
  AL: 67, AK: 30, AZ: 15, AR: 75, CA: 58, CO: 64, CT: 8, DE: 3,
  DC: 1, FL: 67, GA: 159, HI: 5, ID: 44, IL: 102, IN: 92, IA: 99,
  KS: 105, KY: 120, LA: 64, ME: 16, MD: 24, MA: 14, MI: 83, MN: 87,
  MS: 82, MO: 115, MT: 56, NE: 93, NV: 17, NH: 10, NJ: 21, NM: 33,
  NY: 62, NC: 100, ND: 53, OH: 88, OK: 77, OR: 36, PA: 67, RI: 5,
  SC: 46, SD: 66, TN: 95, TX: 254, UT: 29, VT: 14, VA: 133, WA: 39,
  WV: 55, WI: 72, WY: 23,
};

function getMargin(val) {
  if (Array.isArray(val)) return val[0];
  return val;
}

function generateVotes(margin, totalVotes) {
  const demPct = 50 + margin / 2;
  const repPct = 50 - margin / 2;
  const otherPct = Math.max(0, 100 - demPct - repPct) || (Math.random() * 3 + 1);
  const adjustedDem = demPct - otherPct / 2;
  const adjustedRep = repPct - otherPct / 2;
  return {
    dem_votes: Math.round(totalVotes * adjustedDem / 100),
    rep_votes: Math.round(totalVotes * adjustedRep / 100),
    other_votes: Math.round(totalVotes * otherPct / 100),
    total_votes: totalVotes,
    dem_pct: Math.round(adjustedDem * 100) / 100,
    rep_pct: Math.round(adjustedRep * 100) / 100,
  };
}

// Seed random number generator (simple deterministic — same as original)
let seed = 42;
function seededRandom() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

// ---------------------------------------------------------------------------
// Aggregate real county data into state totals for real years
// ---------------------------------------------------------------------------
function aggregateStateFromCounties(year) {
  const stateTotals = {};
  const yearCounties = countyData[year];

  for (const [fips, data] of Object.entries(yearCounties)) {
    const stFips = fips.slice(0, 2);
    const stAbbr = fipsToState[stFips];
    if (!stAbbr) continue;

    if (!stateTotals[stAbbr]) {
      stateTotals[stAbbr] = { dem_votes: 0, rep_votes: 0, other_votes: 0, total_votes: 0 };
    }
    stateTotals[stAbbr].dem_votes += data.dem_votes;
    stateTotals[stAbbr].rep_votes += data.rep_votes;
    stateTotals[stAbbr].other_votes += data.other_votes;
    stateTotals[stAbbr].total_votes += data.total_votes;
  }

  return stateTotals;
}

// ---------------------------------------------------------------------------
// Generate national.json
// ---------------------------------------------------------------------------
const national = {};

for (let yi = 0; yi < allYears.length; yi++) {
  const year = allYears[yi];
  national[year] = {
    candidates: candidates[year],
    states: {},
  };

  if (realYears.includes(year)) {
    // Use real aggregated county data
    const stateTotals = aggregateStateFromCounties(year);

    for (const [state, fips] of Object.entries(stateFips)) {
      const st = stateTotals[state];
      if (st && st.total_votes > 0) {
        const demPct = Math.round((st.dem_votes / st.total_votes) * 10000) / 100;
        const repPct = Math.round((st.rep_votes / st.total_votes) * 10000) / 100;
        const margin = Math.round((demPct - repPct) * 100) / 100;

        national[year].states[state] = {
          margin,
          winner: margin > 0 ? 'DEM' : 'REP',
          dem_votes: st.dem_votes,
          rep_votes: st.rep_votes,
          other_votes: st.other_votes,
          total_votes: st.total_votes,
          dem_pct: demPct,
          rep_pct: repPct,
          dem_candidate: candidates[year].dem,
          rep_candidate: candidates[year].rep,
        };
      } else {
        // Fallback for states missing from CSV (shouldn't happen, but safe)
        const margin = getMargin(stateMargins[state]?.[yi] || 0);
        const turnoutFactor = 0.6 + yi * 0.03 + seededRandom() * 0.05;
        const totalVotes = Math.round((stateVotes[state] || 1000000) * turnoutFactor);
        const votes = generateVotes(margin, totalVotes);
        national[year].states[state] = {
          margin: Math.round(margin * 100) / 100,
          winner: margin > 0 ? 'DEM' : 'REP',
          ...votes,
          dem_candidate: candidates[year].dem,
          rep_candidate: candidates[year].rep,
        };
      }
    }
  } else {
    // Synthetic data for 1976–2004
    for (const [state] of Object.entries(stateFips)) {
      const margin = getMargin(stateMargins[state]?.[yi] || 0);
      const turnoutFactor = 0.6 + yi * 0.03 + seededRandom() * 0.05;
      const totalVotes = Math.round((stateVotes[state] || 1000000) * turnoutFactor);
      const votes = generateVotes(margin, totalVotes);
      national[year].states[state] = {
        margin: Math.round(margin * 100) / 100,
        winner: margin > 0 ? 'DEM' : 'REP',
        ...votes,
        dem_candidate: candidates[year].dem,
        rep_candidate: candidates[year].rep,
      };
    }
  }
}

writeFileSync(
  resolve(root, 'public/data/results/presidential/national.json'),
  JSON.stringify(national, null, 0)
);
console.log('Generated national.json');

// ---------------------------------------------------------------------------
// Generate per-state county files
// ---------------------------------------------------------------------------
for (const [state, fips] of Object.entries(stateFips)) {
  const stateFileData = {};

  for (let yi = 0; yi < allYears.length; yi++) {
    const year = allYears[yi];

    if (realYears.includes(year)) {
      // Real county data for this state
      const counties = {};
      const yearCounties = countyData[year];

      for (const [countyFips, data] of Object.entries(yearCounties)) {
        if (countyFips.slice(0, 2) !== fips) continue;
        const demPct = Math.round((data.dem_votes / data.total_votes) * 10000) / 100;
        const repPct = Math.round((data.rep_votes / data.total_votes) * 10000) / 100;
        const margin = Math.round((demPct - repPct) * 100) / 100;

        counties[countyFips] = {
          margin,
          winner: margin > 0 ? 'DEM' : 'REP',
          dem_votes: data.dem_votes,
          rep_votes: data.rep_votes,
          other_votes: data.other_votes,
          total_votes: data.total_votes,
          dem_pct: demPct,
          rep_pct: repPct,
        };
      }

      stateFileData[year] = {
        candidates: candidates[year],
        counties,
      };
    } else {
      // Synthetic county data for 1976–2004
      const stateMargin = getMargin(stateMargins[state]?.[yi] || 0);
      const numCounties = countyCounts[state] || 50;
      const counties = {};

      for (let i = 0; i < numCounties; i++) {
        const countyFips = fips + String(i * 2 + 1).padStart(3, '0');
        const urbanFactor = seededRandom();
        const countyOffset = (urbanFactor - 0.5) * 40 + (seededRandom() - 0.5) * 20;
        const countyMargin = stateMargin + countyOffset;
        const clampedMargin = Math.max(-70, Math.min(70, countyMargin));
        const countyVotes = Math.round(
          ((stateVotes[state] || 1000000) / numCounties) *
          (0.3 + seededRandom() * 1.4) *
          (0.6 + yi * 0.03)
        );
        const votes = generateVotes(clampedMargin, countyVotes);

        counties[countyFips] = {
          margin: Math.round(clampedMargin * 100) / 100,
          winner: clampedMargin > 0 ? 'DEM' : 'REP',
          ...votes,
        };
      }

      stateFileData[year] = {
        candidates: candidates[year],
        counties,
      };
    }
  }

  writeFileSync(
    resolve(root, `public/data/results/presidential/states/${state}.json`),
    JSON.stringify(stateFileData, null, 0)
  );
}
console.log('Generated state county data files');

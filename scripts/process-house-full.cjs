const fs = require('fs');

// Read CSV
const csvPath = '/Users/jenniferjohnson/Documents/ClaudeCode-Folder/election-map/2024-house - 2024.csv';
const csvData = fs.readFileSync(csvPath, 'utf-8');
const lines = csvData.split('\n').filter(line => line.trim());

// Parse header
const header = lines[0].split(',');
const getCol = (row, col) => {
  // Handle quoted fields with commas
  const parts = [];
  let current = '';
  let inQuotes = false;
  for (const char of row) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  const idx = header.indexOf(col);
  return idx >= 0 ? parts[idx] : null;
};

// Group candidates by district
const districts = {};
for (let i = 1; i < lines.length; i++) {
  const row = lines[i];
  const state = getCol(row, 'state_po');
  const stateFips = getCol(row, 'state_fips').padStart(2, '0');
  const district = getCol(row, 'district');
  const candidate = getCol(row, 'candidate');
  const party = getCol(row, 'party');
  const votes = parseInt(getCol(row, 'candidatevotes'), 10) || 0;
  const totalVotes = parseInt(getCol(row, 'totalvotes'), 10) || 0;
  const isWritein = getCol(row, 'writein') === 'TRUE';

  const districtId = stateFips + district.padStart(2, '0');

  if (!districts[districtId]) {
    districts[districtId] = {
      state,
      district,
      total_votes: totalVotes,
      candidates: []
    };
  }

  // Skip generic writeins with low votes
  if (isWritein && (candidate === 'WRITEIN' || votes < 1000)) continue;

  // Skip data artifacts (including RCV artifacts from Maine/Alaska)
  const artifactNames = ['TOTAL', 'BLANK VOTES', 'UNDER VOTES', 'OVER VOTES', 'UNDERVOTES', 'OVERVOTES',
                         'CONTINUING BALLOTS', 'EXHAUSTED BALLOTS', 'INACTIVE BALLOTS'];
  if (artifactNames.includes(candidate.toUpperCase())) continue;

  districts[districtId].candidates.push({
    name: candidate,
    party: party || 'OTHER',
    votes,
    isWritein
  });
}

// Process each district
const output = { "2024": { summary: { dem_seats: 0, rep_seats: 0, other_seats: 0, total_seats: 0 }, districts: {} } };

for (const [id, data] of Object.entries(districts)) {
  // Sort candidates by votes
  data.candidates.sort((a, b) => b.votes - a.votes);

  const total = data.total_votes;
  const winner = data.candidates[0];
  const winnerParty = winner.party.toUpperCase().includes('DEMOCRAT') ? 'DEM' :
                      winner.party.toUpperCase().includes('REPUBLICAN') ? 'REP' :
                      winner.party.toUpperCase();

  // Find D and R candidates
  const demCandidate = data.candidates.find(c => c.party.toUpperCase().includes('DEMOCRAT'));
  const repCandidate = data.candidates.find(c => c.party.toUpperCase().includes('REPUBLICAN'));

  // Other candidates (not D or R)
  const otherCandidates = data.candidates.filter(c =>
    !c.party.toUpperCase().includes('DEMOCRAT') &&
    !c.party.toUpperCase().includes('REPUBLICAN') &&
    c.votes >= 1000  // Only include if they got at least 1000 votes
  );

  const demVotes = demCandidate?.votes || 0;
  const repVotes = repCandidate?.votes || 0;
  const otherVotes = otherCandidates.reduce((sum, c) => sum + c.votes, 0);

  // Calculate margin (positive = D, negative = R)
  const topTwo = data.candidates.slice(0, 2);
  let margin = 0;
  if (topTwo.length >= 2) {
    const firstPct = (topTwo[0].votes / total) * 100;
    const secondPct = (topTwo[1].votes / total) * 100;
    margin = firstPct - secondPct;
    if (winnerParty === 'REP') margin = -margin;
    else if (winnerParty !== 'DEM') margin = -margin; // Other party wins, negative
  }

  const districtData = {
    state: data.state,
    district: data.district,
    margin: parseFloat(margin.toFixed(2)),
    winner: winnerParty,
    dem_votes: demVotes,
    rep_votes: repVotes,
    total_votes: total,
    dem_pct: total > 0 ? parseFloat((demVotes / total * 100).toFixed(2)) : 0,
    rep_pct: total > 0 ? parseFloat((repVotes / total * 100).toFixed(2)) : 0,
    dem_candidate: demCandidate?.name || null,
    rep_candidate: repCandidate?.name || null,
  };

  if (otherCandidates.length > 0) {
    districtData.other_votes = otherVotes;
    districtData.other_candidates = otherCandidates.map(c => ({
      name: c.name,
      party: c.party.toUpperCase().replace('INDEPENDENT', 'IND').replace('LIBERTARIAN', 'LIB').replace('GREEN', 'GRN'),
      votes: c.votes,
      pct: parseFloat((c.votes / total * 100).toFixed(2)),
      isWinner: c === winner
    }));
  }

  output["2024"].districts[id] = districtData;
  output["2024"].summary.total_seats++;
  if (winnerParty === 'DEM') output["2024"].summary.dem_seats++;
  else if (winnerParty === 'REP') output["2024"].summary.rep_seats++;
  else output["2024"].summary.other_seats++;
}

// Write output
const outputPath = '/Users/jenniferjohnson/claude01/election-map/public/data/results/house/national.json';
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log('Summary:', output["2024"].summary);
console.log('\nDistricts with other candidates (showing first 15):');
const withOthers = Object.entries(output["2024"].districts).filter(([id, d]) => d.other_candidates && d.other_candidates.length > 0);
console.log('Total districts with third party/independent candidates:', withOthers.length);
withOthers.slice(0, 15).forEach(([id, d]) => {
  const others = d.other_candidates.map(c => c.name + ' (' + c.party + '): ' + c.votes.toLocaleString()).join(', ');
  console.log(d.state + '-' + d.district + ': ' + others);
});

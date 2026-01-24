export const PRESIDENTIAL_YEARS = [
  1976, 1980, 1984, 1988, 1992, 1996, 2000, 2004, 2008, 2012, 2016, 2020, 2024
];

export const SENATE_YEARS = Array.from(
  { length: 25 },
  (_, i) => 1976 + i * 2
);

export const HOUSE_YEARS = SENATE_YEARS;

export const GOVERNOR_YEARS = SENATE_YEARS;

export const RACE_TYPES = {
  PRESIDENT: 'presidential',
  SENATE: 'senate',
  HOUSE: 'house',
  GOVERNOR: 'governor',
};

export const YEAR_STEP = {
  [RACE_TYPES.PRESIDENT]: 4,
  [RACE_TYPES.SENATE]: 2,
  [RACE_TYPES.HOUSE]: 2,
  [RACE_TYPES.GOVERNOR]: 2,
};

export const PARTIES = {
  DEM: 'DEM',
  REP: 'REP',
  OTHER: 'OTHER',
};

export const STATE_FIPS = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY',
};

export const FIPS_TO_STATE = STATE_FIPS;

export const STATE_TO_FIPS = Object.fromEntries(
  Object.entries(STATE_FIPS).map(([fips, abbr]) => [abbr, fips])
);

export const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

export const MAP_DIMENSIONS = {
  WIDTH: 960,
  HEIGHT: 600,
};

export const ZOOM_DURATION = 750;
export const MAX_ZOOM = 12;
export const MIN_ZOOM = 1;

// Electoral votes by reapportionment period
// 1970 census → 1972/1976/1980, 1980 census → 1984/1988, 1990 census → 1992/1996/2000,
// 2000 census → 2004/2008, 2010 census → 2012/2016/2020, 2020 census → 2024
const EV_1970 = {
  AL:9,AK:3,AZ:6,AR:6,CA:45,CO:7,CT:8,DE:3,DC:3,FL:17,GA:12,HI:4,ID:4,IL:26,IN:13,
  IA:8,KS:7,KY:9,LA:10,ME:4,MD:10,MA:14,MI:21,MN:10,MS:7,MO:12,MT:4,NE:5,NV:3,NH:4,
  NJ:17,NM:4,NY:41,NC:13,ND:3,OH:25,OK:8,OR:6,PA:27,RI:4,SC:8,SD:4,TN:10,TX:26,UT:4,
  VT:3,VA:12,WA:9,WV:6,WI:11,WY:3,
};
const EV_1980 = {
  AL:9,AK:3,AZ:7,AR:6,CA:47,CO:8,CT:8,DE:3,DC:3,FL:21,GA:12,HI:4,ID:4,IL:24,IN:12,
  IA:8,KS:7,KY:9,LA:10,ME:4,MD:10,MA:13,MI:20,MN:10,MS:7,MO:11,MT:4,NE:5,NV:4,NH:4,
  NJ:16,NM:5,NY:36,NC:13,ND:3,OH:23,OK:8,OR:7,PA:25,RI:4,SC:8,SD:3,TN:11,TX:29,UT:5,
  VT:3,VA:12,WA:10,WV:6,WI:11,WY:3,
};
const EV_1990 = {
  AL:9,AK:3,AZ:8,AR:6,CA:54,CO:8,CT:8,DE:3,DC:3,FL:25,GA:13,HI:4,ID:4,IL:22,IN:12,
  IA:7,KS:6,KY:8,LA:9,ME:4,MD:10,MA:12,MI:18,MN:10,MS:7,MO:11,MT:3,NE:5,NV:4,NH:4,
  NJ:15,NM:5,NY:33,NC:14,ND:3,OH:21,OK:8,OR:7,PA:23,RI:4,SC:8,SD:3,TN:11,TX:32,UT:5,
  VT:3,VA:13,WA:11,WV:5,WI:11,WY:3,
};
const EV_2000 = {
  AL:9,AK:3,AZ:10,AR:6,CA:55,CO:9,CT:7,DE:3,DC:3,FL:27,GA:15,HI:4,ID:4,IL:21,IN:11,
  IA:7,KS:6,KY:8,LA:9,ME:4,MD:10,MA:12,MI:17,MN:10,MS:6,MO:11,MT:3,NE:5,NV:5,NH:4,
  NJ:15,NM:5,NY:31,NC:15,ND:3,OH:20,OK:7,OR:7,PA:21,RI:4,SC:8,SD:3,TN:11,TX:34,UT:5,
  VT:3,VA:13,WA:11,WV:5,WI:10,WY:3,
};
const EV_2010 = {
  AL:9,AK:3,AZ:11,AR:6,CA:55,CO:9,CT:7,DE:3,DC:3,FL:29,GA:16,HI:4,ID:4,IL:20,IN:11,
  IA:6,KS:6,KY:8,LA:8,ME:4,MD:10,MA:11,MI:16,MN:10,MS:6,MO:10,MT:3,NE:5,NV:6,NH:4,
  NJ:14,NM:5,NY:29,NC:15,ND:3,OH:18,OK:7,OR:7,PA:20,RI:4,SC:9,SD:3,TN:11,TX:38,UT:6,
  VT:3,VA:13,WA:12,WV:5,WI:10,WY:3,
};
const EV_2020 = {
  AL:9,AK:3,AZ:11,AR:6,CA:54,CO:10,CT:7,DE:3,DC:3,FL:30,GA:16,HI:4,ID:4,IL:19,IN:11,
  IA:6,KS:6,KY:8,LA:8,ME:4,MD:10,MA:11,MI:15,MN:10,MS:6,MO:10,MT:4,NE:5,NV:6,NH:4,
  NJ:14,NM:5,NY:28,NC:16,ND:3,OH:17,OK:7,OR:8,PA:19,RI:4,SC:9,SD:3,TN:11,TX:40,UT:6,
  VT:3,VA:13,WA:12,WV:4,WI:10,WY:3,
};

export function getElectoralVotes(stateAbbr, year) {
  if (year <= 1980) return EV_1970[stateAbbr] || 0;
  if (year <= 1988) return EV_1980[stateAbbr] || 0;
  if (year <= 2000) return EV_1990[stateAbbr] || 0;
  if (year <= 2008) return EV_2000[stateAbbr] || 0;
  if (year <= 2020) return EV_2010[stateAbbr] || 0;
  return EV_2020[stateAbbr] || 0;
}

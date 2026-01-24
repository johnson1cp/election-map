import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

mkdirSync(resolve(root, 'public/data/geo'), { recursive: true });

// Copy states TopoJSON from us-atlas
const statesPath = resolve(root, 'node_modules/us-atlas/states-10m.json');
const statesData = JSON.parse(readFileSync(statesPath, 'utf-8'));
writeFileSync(
  resolve(root, 'public/data/geo/us-states.json'),
  JSON.stringify(statesData)
);
console.log('Generated us-states.json');

// Copy counties TopoJSON
const countiesPath = resolve(root, 'node_modules/us-atlas/counties-10m.json');
const countiesData = JSON.parse(readFileSync(countiesPath, 'utf-8'));
writeFileSync(
  resolve(root, 'public/data/geo/us-counties.json'),
  JSON.stringify(countiesData)
);
console.log('Generated us-counties.json');

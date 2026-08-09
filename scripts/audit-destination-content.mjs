import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { auditDestinationContent } from './destination-content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const atlas = JSON.parse(
  await readFile(path.join(root, 'public/json/sri-lanka-tourist-places-map.json'), 'utf8')
);
const { rows, issues } = auditDestinationContent(atlas);
const titleLengths = rows.map(({ content }) => content.seoTitle.length);
const descriptionLengths = rows.map(({ content }) => content.seoDescription.length);

console.log(`${rows.length} destination content records generated.`);
console.log(`SEO titles: ${Math.min(...titleLengths)}–${Math.max(...titleLengths)} characters.`);
console.log(`SEO descriptions: ${Math.min(...descriptionLengths)}–${Math.max(...descriptionLengths)} characters.`);
console.log(`Highlights: ${rows.reduce((total, { content }) => total + content.highlights.length, 0)} total.`);

if (issues.length > 0) {
  console.error(issues.join('\n'));
  process.exit(1);
}

console.log('Audit passed: titles and descriptions are unique, within limits, and every destination has 3 highlights.');

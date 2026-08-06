/**
 * Sample photography for every place in the atlas.
 *
 *   node scripts/generate-destination-images.mjs
 *
 * Writes one `public/images/destination/<slug>.jpg` per place — a branded plate
 * built from the place's category and name, so every card and hero has artwork
 * of the right shape and weight while real photography is still being shot.
 * Deterministic: the same slug always produces the same plate, so re-running
 * does not churn the repository.
 *
 * Replacing a placeholder is a one-file drop: put the real photograph at the
 * same path and nothing else changes.
 *
 * Pass `--force` to also overwrite the handful of real photographs copied in
 * from /public/images.
 */
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'public/images/destination');
const force = process.argv.includes('--force');

const WIDTH = 1600;
const HEIGHT = 1100;

/** Category palettes, drawn from the brand tokens in design.md. */
const palettes = {
  beaches: ['#0e5f6b', '#1fa6b6', '#f4e9d3'],
  'ancient-cities-and-ruins': ['#3d2f1c', '#8c6a33', '#f4e9d3'],
  temples: ['#5a2f1e', '#c49a3a', '#f6d888'],
  waterfalls: ['#0a3a3f', '#1f8f7e', '#e6f2ea'],
  'natural-pools': ['#0c4a52', '#2bb3a3', '#eaf6f2'],
  'national-parks-and-wildlife': ['#1d3b18', '#6d8a3a', '#f0efdc'],
  'mountains-and-hiking': ['#123a33', '#3f7f66', '#e9f0ea'],
  'lakes-and-reservoirs': ['#123f4d', '#3b8fa3', '#eaf3f4'],
  'scenic-viewpoints': ['#1a3a4a', '#5f93a6', '#f2ece0'],
  'scenic-train-destinations': ['#0d3b2e', '#2f7d5f', '#f4e9d3'],
  islands: ['#0d4c5c', '#28a2ad', '#f6f1e2'],
  'botanical-gardens-and-parks': ['#16401f', '#5c9445', '#eef3e2'],
  'marine-and-coastal-attractions': ['#083f52', '#1b8fa8', '#e9f4f5']
};

const fallbackPalette = ['#07271f', '#0d3b2e', '#f4e9d3'];

/**
 * Real photographs already in the repository, mapped onto the atlas slugs they
 * genuinely show. Everything else gets a generated plate.
 */
const realPhotographs = {
  'sigiriya-rock-fortress': 'public/images/sigiriya.jpg',
  'mirissa-beach': 'public/images/mirrissa.jpeg',
  ella: 'public/images/ella.jpg',
  'hikkaduwa-marine-sanctuary': 'public/images/hikkaduwa.jpg'
};

/** A stable stream of 0–1 numbers per slug, so each plate is different but fixed. */
function seeded(slug) {
  const digest = createHash('sha256').update(slug).digest();
  let index = 0;
  return () => {
    const byte = digest[index % digest.length];
    index += 1;
    return byte / 255;
  };
}

const escape = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;');

/** Names run from “Ella” to “Temple of the Sacred Tooth Relic”, so they wrap. */
function wrap(name, perLine) {
  const words = name.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > perLine && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

/** A ridge line across the plate — three of them read as layered hills. */
function ridge(random, baseY, amplitude) {
  const points = [];
  for (let x = 0; x <= WIDTH; x += WIDTH / 6) {
    points.push(`${x.toFixed(0)},${(baseY - random() * amplitude).toFixed(0)}`);
  }
  return `M-20,${HEIGHT + 20} L-20,${baseY} L${points.join(' L')} L${WIDTH + 20},${baseY} L${WIDTH + 20},${HEIGHT + 20} Z`;
}

function plate(place) {
  const random = seeded(place.slug);
  const [deep, mid, light] = palettes[place.categoryId] ?? fallbackPalette;
  const lines = wrap(place.name, 18);
  const nameSize = lines.length > 2 ? 92 : lines.length > 1 ? 108 : 124;
  const meta =
    [...new Set([place.city, place.district, place.province].filter(Boolean))]
      .slice(0, 2)
      .join(' · ') || place.province;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="${mid}"/>
      <stop offset="55%" stop-color="${deep}"/>
      <stop offset="100%" stop-color="#041914"/>
    </linearGradient>
    <radialGradient id="sun" cx="${(0.2 + random() * 0.6).toFixed(2)}" cy="0.26" r="0.55">
      <stop offset="0%" stop-color="${light}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${light}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="foot" x1="0" y1="0.45" x2="0" y2="1">
      <stop offset="0%" stop-color="#041914" stop-opacity="0"/>
      <stop offset="100%" stop-color="#041914" stop-opacity="0.92"/>
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sun)"/>
  <circle cx="${(WIDTH * (0.18 + random() * 0.6)).toFixed(0)}" cy="${(HEIGHT * 0.27).toFixed(0)}" r="${(46 + random() * 26).toFixed(0)}" fill="${light}" opacity="0.22"/>
  <path d="${ridge(random, HEIGHT * 0.62, 120)}" fill="#041914" opacity="0.24"/>
  <path d="${ridge(random, HEIGHT * 0.73, 150)}" fill="#041914" opacity="0.42"/>
  <path d="${ridge(random, HEIGHT * 0.86, 110)}" fill="#041914" opacity="0.66"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#foot)"/>
  <rect x="72" y="72" width="${WIDTH - 144}" height="${HEIGHT - 144}" fill="none" stroke="${light}" stroke-opacity="0.24"/>
  <text x="104" y="132" fill="${light}" fill-opacity="0.85" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="7">${escape(place.category.toUpperCase())}</text>
  <text x="${WIDTH - 104}" y="132" text-anchor="end" fill="${light}" fill-opacity="0.6" font-family="Helvetica, Arial, sans-serif" font-size="20" letter-spacing="4">REISECEYLON</text>
  ${lines
    .map(
      (line, index) =>
        `<text x="104" y="${HEIGHT - 210 + (index - (lines.length - 1)) * (nameSize + 6)}" fill="#fafaf8" font-family="Georgia, 'Times New Roman', serif" font-size="${nameSize}" font-weight="600">${escape(line)}</text>`
    )
    .join('\n  ')}
  <text x="104" y="${HEIGHT - 140}" fill="${light}" fill-opacity="0.78" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="3">${escape(meta.toUpperCase())}</text>
  <text x="104" y="${HEIGHT - 96}" fill="#fafaf8" fill-opacity="0.5" font-family="Helvetica, Arial, sans-serif" font-size="22" letter-spacing="2">${place.latitude.toFixed(4)}° N, ${place.longitude.toFixed(4)}° E</text>
</svg>`;
}

async function main() {
  const atlas = JSON.parse(
    await readFile(path.join(root, 'public/json/sri-lanka-tourist-places-map.json'), 'utf8')
  );
  await mkdir(outputDir, { recursive: true });

  let generated = 0;
  let copied = 0;

  for (const raw of atlas.places) {
    const target = path.join(outputDir, `${raw.slug}.jpg`);
    const real = realPhotographs[raw.slug];

    if (real && !force) {
      await copyFile(path.join(root, real), target);
      copied += 1;
      continue;
    }

    const svg = plate({
      slug: raw.slug,
      name: raw.name,
      category: raw.category,
      categoryId: raw.categoryId,
      city: raw.city,
      district: raw.district,
      province: raw.province,
      latitude: raw.location.latitude,
      longitude: raw.location.longitude
    });

    const jpeg = await sharp(Buffer.from(svg))
      .jpeg({ quality: 74, mozjpeg: true, chromaSubsampling: '4:4:4' })
      .toBuffer();
    await writeFile(target, jpeg);
    generated += 1;
  }

  console.log(`${generated} sample plates generated, ${copied} real photographs copied.`);
  console.log(`→ ${path.relative(root, outputDir)}/<slug>.jpg`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});

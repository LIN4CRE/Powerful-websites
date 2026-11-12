/**
 * Rasterises the project's own SVG mark into the PNG sizes the web app manifest,
 * iOS and browsers need. The artwork is the existing POWERFUL WEBSITES logo —
 * nothing is invented, and no third-party brand assets are used.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'public', 'favicon.svg');
const OUT = path.join(ROOT, 'public', 'icons');

const PNG_SIZES: Array<{ file: string; size: number; padding: number; background?: string }> = [
  { file: 'icon-192.png', size: 192, padding: 0 },
  { file: 'icon-512.png', size: 512, padding: 0 },
  // Maskable icons need a 20% safe zone so Android can crop any shape.
  { file: 'maskable-512.png', size: 512, padding: 0.2, background: '#05070c' },
  { file: 'apple-touch-icon.png', size: 180, padding: 0.08, background: '#05070c' },
  { file: 'favicon-32.png', size: 32, padding: 0 },
  { file: 'favicon-16.png', size: 16, padding: 0 },
];

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const svg = await fs.readFile(SOURCE);

  for (const { file, size, padding, background } of PNG_SIZES) {
    const inner = Math.round(size * (1 - padding * 2));
    const offset = Math.round((size - inner) / 2);
    const mark = await sharp(svg, { density: 384 }).resize(inner, inner).png().toBuffer();

    const base = background
      ? sharp({ create: { width: size, height: size, channels: 4, background } })
      : sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });

    await base
      .composite([{ input: mark, top: offset, left: offset }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT, file));
    console.log(`icons/${file}`);
  }

  // A social preview keeps link unfurls on-brand without external services.
  const social = await sharp({
    create: { width: 1200, height: 630, channels: 4, background: '#05070c' },
  })
    .composite([
      { input: await sharp(svg, { density: 512 }).resize(260, 260).png().toBuffer(), top: 185, left: 100 },
    ])
    .png()
    .toFile(path.join(ROOT, 'public', 'social-card.png'));
  console.log('public/social-card.png', social.width, social.height);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

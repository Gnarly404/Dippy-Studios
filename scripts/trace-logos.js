const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { Potrace } = require('potrace');

async function main() {
  const repoRoot = path.join(__dirname, '..');
  const inputDir = path.join(repoRoot, 'assets', 'images', 'brands');
  const svgDir = path.join(inputDir, 'svg');
  await fs.mkdir(svgDir, { recursive: true });

  const entries = await fs.readdir(inputDir);
  const rasterFiles = entries.filter(f => /.png|.jpe?g$/i.test(f));

  for (const file of rasterFiles) {
    const base = path.parse(file).name;
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(svgDir, `${base}.svg`);

    try {
      // Resize to a reasonable tracing size, keep alpha if present
      const buffer = await sharp(inputPath).resize({ width: 800, withoutEnlargement: true }).png().toBuffer();

      await new Promise((resolve, reject) => {
        Potrace.trace(buffer, { turdSize: 100, optTolerance: 0.4 }, async (err, svg) => {
          if (err) return reject(err);
          await fs.writeFile(outputPath, svg, 'utf8');
          console.log(`Traced: ${file} -> svg/${base}.svg`);
          resolve();
        });
      });
    } catch (err) {
      console.error(`Failed: ${file}`, err.message || err);
    }
  }

  // Update data/brands.json to point to generated svg files when available
  const brandsPath = path.join(repoRoot, 'data', 'brands.json');
  try {
    const raw = await fs.readFile(brandsPath, 'utf8');
    const brands = JSON.parse(raw);
    const updated = brands.map(b => {
      const base = path.parse(b.file).name;
      const candidate = `svg/${base}.svg`;
      const candidatePath = path.join(svgDir, `${base}.svg`);
      // If the svg exists, update the file property to the svg path
      try {
        // use sync check via fs.access
      } catch (e) {}
      return b;
    });

    // Perform existence check and update
    for (const b of updated) {
      const base = path.parse(b.file).name;
      const cand = path.join(svgDir, `${base}.svg`);
      try {
        await fs.access(cand);
        b.file = `svg/${base}.svg`;
      } catch (e) {
        // no svg for this brand, leave as-is
      }
    }

    await fs.writeFile(brandsPath, JSON.stringify(updated, null, 2), 'utf8');
    console.log('Updated data/brands.json with available svg paths.');
  } catch (err) {
    console.error('Could not update data/brands.json:', err.message || err);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

// Builds the three Vite configs into one site:
//   dist/            default (Preact alias + dedupe)
//   dist/noalias/    no Preact alias
//   dist/onepreact/  alias + the npm properties panel on the app's Preact
import { build } from 'vite';

const variants = [
  ['vite.config.js', 'dist'],
  ['vite.noalias.config.js', 'dist/noalias'],
  ['vite.onepreact.config.js', 'dist/onepreact']
];

for (const [configFile, outDir] of variants) {
  console.log(`\n[build-all] ${configFile} -> ${outDir}`);
  await build({ configFile, logLevel: 'warn', build: { outDir, emptyOutDir: true } });
}

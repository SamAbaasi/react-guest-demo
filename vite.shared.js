import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';

export const root = dirname(fileURLToPath(import.meta.url));

const version = (pkgJson) => JSON.parse(readFileSync(resolve(root, 'node_modules', pkgJson), 'utf8')).version;

/** Which Preact copies are installed - shown on the Preact page. */
export const versions = {
  react: version('react/package.json'),
  preact: version('preact/package.json'),
  editorPreact: (() => {
    try { return version('@bpmn-io/form-js-editor/node_modules/preact/package.json'); } catch { return null; }
  })(),
  panelPreact: version('@bpmn-io/properties-panel/preact/package.json'),
  formJs: version('@bpmn-io/form-js-viewer/package.json'),
  panel: version('@bpmn-io/properties-panel/package.json')
};

/** One Preact for everyone: the same resolve block the production app uses. */
export const forceOnePreact = {
  alias: {
    preact: resolve(root, 'node_modules/preact'),
    'preact/hooks': resolve(root, 'node_modules/preact/hooks'),
    'preact/compat': resolve(root, 'node_modules/preact/compat'),
    'preact/jsx-runtime': resolve(root, 'node_modules/preact/jsx-runtime')
  },
  dedupe: ['preact', 'preact/hooks']
};

/**
 * @param {string} configName  shown on the Preact page
 * @param {'default'|'noalias'|'onepreact'} variant  also the folder in the full build
 */
export function baseConfig(configName, variant) {
  return {
    // Relative URLs: the build works from any folder (dist/, dist/noalias/, GitHub Pages).
    base: './',
    // Each config pre-bundles dependencies differently, so each gets its own cache.
    cacheDir: `node_modules/.vite-${variant}`,
    plugins: [react({ include: /\.jsx$/ })],
    define: {
      __CONFIG_NAME__: JSON.stringify(configName),
      __VARIANT__: JSON.stringify(variant),
      __VERSIONS__: JSON.stringify(versions)
    },
    build: {
      target: 'esnext',
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html'),
          preact: resolve(root, 'preact.html')
        }
      }
    }
  };
}

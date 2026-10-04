// Default config + two lines that make the npm properties panel use the
// app's Preact, instead of a 4,000-line vendored copy:
//   1. send the panel's relative '../preact/*' imports to 'preact/*'
//   2. keep the panel out of dependency pre-bundling, or (1) is ignored in dev
import { defineConfig } from 'vite';
import { baseConfig, forceOnePreact } from './vite.shared.js';

export default defineConfig({
  ...baseConfig('alias + panel uses app Preact', 'onepreact'),
  resolve: {
    ...forceOnePreact,
    alias: [
      ...Object.entries(forceOnePreact.alias).map(([find, replacement]) => ({ find, replacement })),
      { find: /^\.\.\/preact(\/.*)?$/, replacement: 'preact$1' }
    ]
  },
  optimizeDeps: { exclude: ['@bpmn-io/properties-panel'] }
});

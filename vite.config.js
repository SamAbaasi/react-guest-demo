// Default: Preact alias + dedupe, like the production app.
import { defineConfig } from 'vite';
import { baseConfig, forceOnePreact } from './vite.shared.js';

export default defineConfig({
  ...baseConfig('default: preact alias + dedupe', 'default'),
  resolve: forceOnePreact,
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    testTimeout: 30000,
    // Bridge tests measure real timing; parallel files under load can merge Preact renders.
    fileParallelism: false,
    // editor-npm.test.js expects the "two Preact copies" crash; the crashed panel
    // keeps throwing from later renders. Ignore unhandled errors from that file only.
    onUnhandledError(error) {
      if (String(error?.VITEST_TEST_PATH ?? '').includes('editor-npm.test.js')) return false;
    },
    server: { deps: { inline: [/@bpmn-io\//] } }
  }
});

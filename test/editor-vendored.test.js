// @vitest-environment jsdom
// The same editor, FeelEntry from the vendored copy (imports the app's Preact).
import { it, expect } from 'vitest';
import { FeelEntry } from '../src/preact-demo/vendored-panel.js';
import { openEditorWith } from './editorHelper.js';

it('FeelEntry from the vendored copy renders', async () => {
  const result = await openEditorWith(FeelEntry);
  expect(result.errors).toEqual([]);
  expect(result.groups).toBeGreaterThan(0);
  expect(result.entry).toBe(true);
});

// @vitest-environment jsdom
// The real form-js editor, custom entry built on FeelEntry from the npm panel.
// That panel ships its own Preact, so the entry's hooks belong to another copy.
import { it, expect } from 'vitest';
import { options } from 'preact';
import { FeelEntry } from '@bpmn-io/properties-panel';
import { openEditorWith } from './editorHelper.js';

it('FeelEntry from the npm panel crashes the properties panel', async () => {
  // Render synchronously, so the crash happens inside this test and can be caught.
  options.debounceRendering = (callback) => callback();
  const result = await openEditorWith(FeelEntry);
  expect(result.errors.join('\n')).toMatch(/__H/);
  expect(result.entry).toBe(false);
});

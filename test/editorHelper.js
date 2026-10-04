import { FormEditor } from '@bpmn-io/form-js-editor';
import { createRuleModule } from '../src/preact-demo/ruleEntry.js';
import { sleep } from './helpers.js';

/**
 * Opens the real form-js editor with one custom properties entry built on
 * the given FeelEntry, selects the field and reports what rendered.
 */
export async function openEditorWith(FeelEntry) {
  const errors = [];
  // form-js's event bus catches listener errors and logs them; Preact may also
  // throw from a later render. Collect both.
  const consoleError = console.error;
  console.error = (...args) => errors.push(args.map((a) => (a instanceof Error ? `${a.name}: ${a.message}` : String(a))).join(' '));
  window.addEventListener('error', (event) => {
    errors.push(`${event.error?.name}: ${event.error?.message}`);
    event.preventDefault();
  });
  const container = document.createElement('div');
  document.body.appendChild(container);
  try {
    const editor = new FormEditor({ container, additionalModules: [createRuleModule(FeelEntry)] });
    await editor.importSchema({ type: 'default', id: 'F', components: [{ type: 'textfield', id: 'Field_1', key: 'name', label: 'Name' }] });
    editor.get('selection').set(editor.get('formFieldRegistry').get('Field_1'));
    await sleep(300);
  } catch (e) {
    errors.push(`${e.name}: ${e.message}`);
  }
  console.error = consoleError;
  return {
    errors,
    groups: container.querySelectorAll('.bio-properties-panel-group').length,
    entry: !!container.querySelector('[data-entry-id="visibility-rule"]')
  };
}

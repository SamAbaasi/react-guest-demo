import { Form } from '@bpmn-io/form-js-viewer';
import { AsyncPicker } from '../src/react/AsyncPicker.jsx';
import { MODES, resetRegistries } from '../src/bridge/modes.js';
import { createPickerModule } from '../src/bridge/fieldModule.js';
import { resetInstrumentation, stats, events } from '../src/bridge/instrument.js';
import { makeSchema, INITIAL_DATA } from '../src/demo/scenarios.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = false;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Wait for Preact effects, React's async render and the 150 ms timers. */
export const settle = () => sleep(300);

export async function mountForm(modeKey, options = {}) {
  resetInstrumentation();
  resetRegistries();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const Bridge = MODES[modeKey].create(AsyncPicker, options);
  const form = new Form({ container, additionalModules: [createPickerModule(Bridge)] });
  await form.importSchema(makeSchema({ stableRows: true }), INITIAL_DATA);
  await settle();
  return {
    form,
    container,
    picker: () => container.querySelector('[data-picker-id]'),
    pickerValue: () => container.querySelector('.picker-value')?.textContent,
    pickerMeta: () => container.querySelector('.picker-meta')?.textContent,
    cleanup: async () => {
      try { form.destroy(); } catch { /* already destroyed */ }
      await settle();
      container.remove();
    }
  };
}

export function snapshot() {
  return { ...stats };
}

export function eventMessages(kind) {
  return events.filter((e) => !kind || e.kind === kind).map((e) => e.message);
}

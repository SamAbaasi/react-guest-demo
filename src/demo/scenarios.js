// Form schema and the exact sequences the demo buttons and the tests run.
import { PICKER_TYPE } from '../bridge/fieldModule.js';
import { log } from '../bridge/instrument.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Resolves true when check() passes, false after the timeout. */
async function waitFor(check, timeout = 1500) {
  const start = performance.now();
  while (!check()) {
    if (performance.now() - start > timeout) return false;
    await sleep(5);
  }
  return true;
}

const pickerOnScreen = (form) => !!form._container.querySelector('[data-picker-id]');

/**
 * @param {{ stableRows?: boolean }} options
 *   stableRows: true  -> every field has a fixed layout.row id
 *   stableRows: false -> no layout.row, form-js generates new random row ids
 *                        on every import, so every row (and field) is remounted
 */
export function makeSchema({ stableRows = true } = {}) {
  const row = (id) => (stableRows ? { layout: { row: id } } : {});
  return {
    type: 'default',
    id: 'DemoForm',
    components: [
      { type: 'textfield', id: 'Field_filter', key: 'filter', label: 'Filter (passed to React as a prop)', ...row('Row_1') },
      { type: 'textfield', id: 'Field_notes', key: 'notes', label: 'Notes (not used by React)', ...row('Row_2') },
      { type: 'checkbox', id: 'Field_hide', key: 'hidePicker', label: 'Hide the picker', ...row('Row_3') },
      {
        type: PICKER_TYPE,
        id: 'Field_fruit',
        key: 'fruit',
        label: 'Fruit (React component)',
        conditional: { hide: '=hidePicker' },
        ...row('Row_4')
      }
    ]
  };
}

export const INITIAL_DATA = { filter: '', notes: '', hidePicker: false, fruit: 'Banana' };

/** Change a field value the same way a user edit does. */
export function setValue(form, key, value) {
  const field = form.get('formFieldRegistry').getAll().find((f) => f.key === key);
  const fieldInstance = form.get('formFieldInstanceRegistry').getAll().find((i) => i.id === field.id);
  form._update({ field, fieldInstance, value });
}

export function getData(form) {
  return form._getState().data;
}

export const scenarios = {
  async typeFilter(form) {
    for (const text of ['a', 'an', 'ana']) {
      setValue(form, 'filter', text);
      await sleep(120);
    }
  },
  async typeNotes(form) {
    for (const text of ['h', 'hi', 'hi!']) {
      setValue(form, 'notes', text);
      await sleep(120);
    }
  },
  async hideShowFast(form) {
    setValue(form, 'hidePicker', true);
    await sleep(30);
    setValue(form, 'hidePicker', false);
  },
  /**
   * Each cycle hides the picker, waits until it is really gone, shows it and
   * waits until it is really back - as fast as the DOM allows, so a field is
   * often hidden again before Preact has run its useEffect.
   * Returns how many cycles completed.
   */
  async hideShowTimes(form, times = 10, { pause = 0 } = {}) {
    for (let i = 0; i < times; i++) {
      setValue(form, 'hidePicker', true);
      await waitFor(() => !pickerOnScreen(form));
      if (pause) await sleep(pause);
      setValue(form, 'hidePicker', false);
      if (!(await waitFor(() => pickerOnScreen(form)))) {
        log('bug', `cycle ${i + 1}: the picker did not come back - its div stays empty`);
        return i;
      }
      if (pause) await sleep(pause);
    }
    return times;
  },
  /** Same, but slow: Preact has run every useEffect before the next step. */
  async hideShowSlow(form, times = 3) {
    return scenarios.hideShowTimes(form, times, { pause: 200 });
  },
  /** One slow cycle: the cleanup is registered, and we can watch what it does. */
  async hideShowOnce(form) {
    const done = await scenarios.hideShowTimes(form, 1, { pause: 200 });
    await sleep(300);
    return done;
  },
  /** Same schema again: same Preact instances, same divs. New value for the picker. */
  async reimportSameRows(form) {
    await form.importSchema(makeSchema({ stableRows: true }), { ...getData(form), fruit: 'Cherry' });
  },
  /** No row ids: form-js makes new row keys, so the field is unmounted and mounted in one render. */
  async reimportNewRows(form) {
    await form.importSchema(makeSchema({ stableRows: false }), { ...getData(form), fruit: 'Cherry' });
  }
};

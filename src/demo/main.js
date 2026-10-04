import { Form } from '@bpmn-io/form-js-viewer';
import '@bpmn-io/form-js-viewer/dist/assets/form-js.css';
import './demo.css';

import { AsyncPicker } from '../react/AsyncPicker.jsx';
import { MODES } from '../bridge/modes.js';
import { createPickerModule } from '../bridge/fieldModule.js';
import { stats, onEvent, events, markAction, log, liveRoots, livePickers } from '../bridge/instrument.js';
import { makeSchema, INITIAL_DATA, scenarios, getData } from './scenarios.js';
import { renderLogEntry, $ } from './ui.js';
import { setupStepBar } from './stepbar.js';

$('#not-served')?.remove();

const params = new URLSearchParams(location.search);
const modeKey = MODES[params.get('mode')] ? params.get('mode') : 'deferredCheck';
const generation = params.get('generation') === '1';
const mode = MODES[modeKey];
const keep = params.get('camera') ? `&camera=${params.get('camera')}` : '';

// ---- mode switch: a full reload, so leaked roots from another mode never mix in
$('#modes').innerHTML = Object.entries(MODES)
  .map(([key, m]) => `<a href="?mode=${key}${keep}" class="${key === modeKey ? 'active' : ''}">${m.tab}</a>`)
  .join('');
$('#mode-summary').innerHTML = `<b>${mode.title}${generation ? ' + generation counter' : ''}</b><br>${mode.summary}`;
if (modeKey === 'deferredCheck') {
  $('#generation-toggle').hidden = false;
  $('#generation').checked = generation;
  $('#generation').addEventListener('change', (e) => {
    location.search = `?mode=${modeKey}${e.target.checked ? '&generation=1' : ''}${keep}`;
  });
}

// ---- the form
const Bridge = mode.create(AsyncPicker, { generation });
let form = null;

async function mountForm() {
  form = new Form({ container: $('#form'), additionalModules: [createPickerModule(Bridge)] });
  form.on('changed', showData);
  await form.importSchema(makeSchema({ stableRows: true }), INITIAL_DATA);
  showData();
}

function destroyForm() {
  form?.destroy();
  form = null;
  showData();
}

function showData() {
  const data = form ? getData(form) : null;
  $('#form-data').textContent = data ? `form data: fruit = "${data.fruit}", filter = "${data.filter}"` : 'form destroyed';
}

// ---- actions: buttons and presenter steps run the same code
const BUTTONS = [
  ['Type in Filter', 'typeFilter', 'prop React uses'],
  ['Type in Notes', 'typeNotes', 'prop React ignores'],
  ['Hide → show (30 ms)', 'hideShowFast', 'remount'],
  ['Hide/show × 10, fast', 'hideShowTimes', 'hidden again before useEffect runs'],
  ['Hide/show × 3, slow', 'hideShowSlow', 'every useEffect has run'],
  ['Re-import, same rows', 'reimportSameRows', 'same instance, fruit → Cherry'],
  ['Re-import, new row ids', 'reimportNewRows', 'remount in one render'],
  ['Destroy form', 'destroy', ''],
  ['Mount form', 'mount', '']
];
const LABEL = Object.fromEntries(BUTTONS.map(([label, id]) => [id, label]));

$('#buttons').innerHTML = BUTTONS.map(([label, id, hint]) =>
  `<button type="button" data-action="${id}">${label}${hint ? `<small>${hint}</small>` : ''}</button>`).join('');

function flash(element) {
  if (!element) return;
  element.classList.remove('pressed');
  void element.offsetWidth;
  element.classList.add('pressed');
}

async function runAction(action) {
  flash(document.querySelector(`[data-action="${action}"]`));
  markAction(LABEL[action] || action);
  if (action === 'destroy') return destroyForm();
  if (action === 'mount') return form ? log('ok', 'form already mounted') : mountForm();
  if (!form) return log('bug', 'no form - press "Mount form"');
  await scenarios[action](form);
}

async function openPicker() {
  const picker = $('#form .picker');
  if (!picker) return;
  flash(picker);
  if (!picker.querySelector('.picker-panel')) picker.querySelector('.picker-trigger').click();
  await new Promise((resolve) => setTimeout(resolve, 500));
}

$('#buttons').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (button) runAction(button.dataset.action);
});

// ---- monitor
$('#clear-log').addEventListener('click', () => { $('#log').innerHTML = ''; });
onEvent((entry) => {
  const list = $('#log');
  list.append(renderLogEntry(entry));
  while (list.children.length > 200) list.firstChild.remove();
  list.scrollTop = list.scrollHeight;
});
events.forEach((entry) => $('#log').append(renderLogEntry(entry)));

let spotlight = [];
function renderCounters() {
  const onScreen = document.querySelectorAll('#form [data-picker-id]').length;
  const leaked = Math.max(0, livePickers() - onScreen);
  const expectPicker = !!form && !getData(form).hidePicker;
  const counter = (key, value, label, bad = false) =>
    `<div class="counter ${bad ? 'bad' : ''} ${spotlight.includes(key) ? 'spot' : ''}"><b>${value}</b><span>${label}</span></div>`;
  $('#counters').innerHTML = [
    counter('created', stats.rootsCreated, 'roots created'),
    counter('unmounted', stats.rootsUnmounted, 'roots unmounted'),
    counter('alive', liveRoots(), 'roots alive', liveRoots() > onScreen),
    counter('onScreen', onScreen, 'pickers on screen', expectPicker && onScreen === 0),
    counter('leaked', leaked, 'pickers leaked', leaked > 0),
    counter('listeners', stats.documentListeners, 'document listeners', stats.documentListeners > onScreen),
    counter('rootRenders', stats.rootRenders, 'root.render() calls')
  ].join('');
}
setInterval(renderCounters, 100);

setupStepBar($('#stepbar'), {
  openPicker,
  ...Object.fromEntries(BUTTONS.map(([, id]) => [id, () => runAction(id)]))
}, (keys) => { spotlight = keys; });

log('ok', `mode: ${mode.title}${generation ? ' + generation counter' : ''}`);
mountForm();

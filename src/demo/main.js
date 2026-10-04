import { Form } from '@bpmn-io/form-js-viewer';
import '@bpmn-io/form-js-viewer/dist/assets/form-js-base.css';
import './demo.css';

import { AsyncPicker } from '../react/AsyncPicker.jsx';
import { MODES } from '../bridge/modes.js';
import { createPickerModule } from '../bridge/fieldModule.js';
import { stats, onEvent, events, markAction, log, liveRoots, livePickers } from '../bridge/instrument.js';
import { makeSchema, INITIAL_DATA, scenarios, getData } from './scenarios.js';
import { renderLogEntry, $ } from './ui.js';

const params = new URLSearchParams(location.search);
const modeKey = MODES[params.get('mode')] ? params.get('mode') : 'deferredCheck';
const generation = params.get('generation') === '1';
const mode = MODES[modeKey];

// ---- mode switch: a full reload, so leaked roots from another mode never mix in
$('#modes').innerHTML = Object.entries(MODES)
  .map(([key, m]) => `<a href="?mode=${key}" class="${key === modeKey ? 'active' : ''}">${m.tab}</a>`)
  .join('');
$('#mode-summary').innerHTML = `<b>${mode.title}</b><br>${mode.summary}`;
if (modeKey === 'deferredCheck') {
  $('#generation-toggle').hidden = false;
  $('#generation').checked = generation;
  $('#generation').addEventListener('change', (e) => {
    location.search = `?mode=${modeKey}${e.target.checked ? '&generation=1' : ''}`;
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

// ---- buttons
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

$('#buttons').innerHTML = BUTTONS.map(([label, id, hint]) =>
  `<button type="button" data-action="${id}">${label}${hint ? `<small>${hint}</small>` : ''}</button>`).join('');

$('#buttons').addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  markAction(button.firstChild.textContent);
  if (action === 'destroy') return destroyForm();
  if (action === 'mount') return form ? log('ok', 'form already mounted') : mountForm();
  if (!form) return log('bug', 'no form - press "Mount form"');
  await scenarios[action](form);
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

function renderCounters() {
  const onScreen = document.querySelectorAll('[data-picker-id]').length;
  const leaked = Math.max(0, livePickers() - onScreen);
  $('#counters').innerHTML = `
    <div class="counter"><b>${stats.rootsCreated}</b><span>roots created</span></div>
    <div class="counter"><b>${stats.rootsUnmounted}</b><span>roots unmounted</span></div>
    <div class="counter ${liveRoots() > onScreen ? 'bad' : ''}"><b>${liveRoots()}</b><span>roots alive</span></div>
    <div class="counter"><b>${onScreen}</b><span>pickers on screen</span></div>
    <div class="counter ${leaked ? 'bad' : ''}"><b>${leaked}</b><span>pickers leaked</span></div>
    <div class="counter ${stats.documentListeners > onScreen ? 'bad' : ''}"><b>${stats.documentListeners}</b><span>document listeners</span></div>
    <div class="counter"><b>${stats.rootRenders}</b><span>root.render() calls</span></div>`;
}
setInterval(renderCounters, 100);

log('ok', `mode: ${mode.title}${generation ? ' + generation counter' : ''}`);
mountForm();

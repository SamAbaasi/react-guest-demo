import '@bpmn-io/form-js-editor/dist/assets/form-js-editor.css';
import '@bpmn-io/form-js-editor/dist/assets/properties-panel.css';
import '../demo/demo.css';
import './preact-demo.css';

import { $ } from '../demo/ui.js';
import { createRuleModule } from './ruleEntry.js';
import { runLifecycleDemo } from './lifecycle.js';

const versions = __VERSIONS__;
const params = new URLSearchParams(location.search);
const panelSource = params.get('panel') === 'vendored' ? 'vendored' : 'npm';

// ---- error capture (shown big on screen)
const errors = [];
function showError(text) {
  errors.push(text);
  const li = document.createElement('li');
  li.className = 'log-bug';
  li.textContent = text;
  $('#errors').append(li);
}
window.addEventListener('error', (e) => showError(e.error ? `${e.error.name}: ${e.error.message}` : e.message));
window.addEventListener('unhandledrejection', (e) => showError(`(in promise) ${e.reason?.name}: ${e.reason?.message}`));
const consoleError = console.error;
console.error = (...args) => {
  const first = args.find((a) => a instanceof Error);
  showError(first ? `${first.name}: ${first.message}` : args.map(String).join(' ').slice(0, 200));
  consoleError(...args);
};

// ---- header and versions
$('#panel-modes').innerHTML = [
  ['npm', 'FeelEntry from npm @bpmn-io/properties-panel'],
  ['vendored', 'FeelEntry from vendored copy']
].map(([key, label]) => `<a href="?panel=${key}" class="${key === panelSource ? 'active' : ''}">${label}</a>`).join('');

$('#versions').innerHTML = `
  <div><span>Vite config</span><b>${__CONFIG_NAME__}</b></div>
  <div><span>App + form-js viewer</span><b>preact ${versions.preact}</b></div>
  <div><span>form-js editor</span><b>${versions.editorPreact ? `preact ${versions.editorPreact} (own copy)` : 'shares app preact'}</b></div>
  <div><span>npm properties panel</span><b>preact ${versions.panelPreact} (bundled)</b></div>
  <div><span>Entry imports FeelEntry from</span><b>${panelSource === 'npm' ? '@bpmn-io/properties-panel' : './vendored-panel.js'}</b></div>`;

// ---- the editor with one custom properties entry
async function start() {
  const { FormEditor } = await import('@bpmn-io/form-js-editor');
  const { FeelEntry } = panelSource === 'npm'
    ? await import('@bpmn-io/properties-panel')
    : await import('./vendored-panel.js');

  const editor = new FormEditor({
    container: $('#editor'),
    additionalModules: [createRuleModule(FeelEntry)]
  });
  window.formEditor = editor;
  await editor.importSchema({
    type: 'default',
    id: 'RuleForm',
    components: [{ type: 'textfield', id: 'Field_name', key: 'name', label: 'Name' }]
  });
  editor.get('selection').set(editor.get('formFieldRegistry').get('Field_name'));
}

function showStatus() {
  const canvas = !!document.querySelector('.fjs-form-field-textfield');
  const groups = document.querySelectorAll('.bio-properties-panel-group').length;
  const entry = !!document.querySelector('[data-entry-id="visibility-rule"]');
  const rule = window.formEditor?.saveSchema?.().components?.[0]?.rule;
  $('#status').innerHTML = `
    <div class="${canvas ? 'good' : 'bad'}">Editor canvas: ${canvas ? 'rendered' : 'BLANK'}</div>
    <div class="${groups ? 'good' : 'bad'}">Properties panel: ${groups ? `${groups} groups` : 'EMPTY'}</div>
    <div class="${entry ? 'good' : 'bad'}">Custom "Visibility rule" entry: ${entry ? 'rendered' : 'missing'}</div>
    <div>Saved rule: <b>${rule ? rule : '—'}</b></div>`;
}

start().catch((e) => showError(`${e.name}: ${e.message}`));
setInterval(showStatus, 300);

$('#run-lifecycle').addEventListener('click', () => runLifecycleDemo($('#lifecycle-root'), $('#lifecycle')));
$('#run-lifecycle-fast').addEventListener('click', () => runLifecycleDemo($('#lifecycle-root'), $('#lifecycle'), { unmountBeforeEffect: true }));

// The step bar at the top of both pages: shows the current step and what to
// watch, and drives the demo from the keyboard.
import { STEPS, stepUrl, stepAvailable } from './steps.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Text shown before the step runs: the question if there is one. */
function before(step) {
  return step.run.length && step.ask ? step.ask : step.watch;
}

/**
 * @param {HTMLElement} bar
 * @param {Record<string, () => Promise<void>|void>} actions  what this page can run
 * @param {(names: string[]) => void} [spot]                 highlight counters
 */
export function setupStepBar(bar, actions, spot = () => {}) {
  const params = new URLSearchParams(location.search);
  const current = Number(params.get('step')) - 1;
  const step = STEPS[current];

  // Camera area (bottom right) stays free unless ?camera=0
  document.body.classList.toggle('camera-safe', params.get('camera') !== '0');

  const go = (index) => {
    if (index < 0 || index >= STEPS.length) return;
    if (!stepAvailable(index)) {
      bar.querySelector('.step-watch').textContent = `Step ${index + 1} needs the full build: run "npm run demo".`;
      return;
    }
    location.href = stepUrl(index);
  };

  if (!step) {
    bar.innerHTML = `<div class="step-main"><span class="step-section">Presenter steps</span>
      <span class="step-watch">Press → to start (${STEPS.length} steps). Space runs a step.</span></div>
      <div class="step-keys"><button type="button" data-go="next">▶</button></div>`;
  } else {
    bar.innerHTML = `
      <div class="step-num">${current + 1}<small>/${STEPS.length}</small></div>
      <div class="step-main">
        <span class="step-section">${step.section}</span>
        <span class="step-title">${step.title}</span>
        <span class="step-watch">${before(step)}</span>
      </div>
      <div class="step-keys">
        <button type="button" data-go="prev" title="previous (←)">◀</button>
        ${step.run.length ? '<button type="button" data-go="run" class="run" title="run (Space)">Run ␣</button>' : ''}
        <button type="button" data-go="next" title="next (→)">▶</button>
      </div>`;
    spot(step.spot || []);
  }

  let running = false;
  async function run() {
    if (!step || running || !step.run.length) return;
    running = true;
    bar.classList.add('running');
    for (const name of step.run) {
      await actions[name]?.();
      await sleep(250);
    }
    bar.classList.remove('running');
    bar.classList.add('done');
    // Only now show the result, so the question is not answered in advance.
    bar.querySelector('.step-watch').textContent = step.watch;
    running = false;
  }

  // ?autorun=1 runs the step once the page has settled (used for screenshots).
  if (params.get('autorun') === '1') setTimeout(run, 1500);

  bar.addEventListener('click', (event) => {
    const target = event.target.closest('[data-go]');
    if (!target) return;
    if (target.dataset.go === 'run') run();
    if (target.dataset.go === 'next') go(step ? current + 1 : 0);
    if (target.dataset.go === 'prev') go(current - 1);
  });

  window.addEventListener('keydown', (event) => {
    const typing = event.target.closest?.('input, textarea, [contenteditable="true"]');
    if (typing) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); go(step ? current + 1 : 0); }
    if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); go(current - 1); }
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); run(); }
  });
}

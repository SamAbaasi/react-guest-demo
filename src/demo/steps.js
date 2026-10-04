// The presenter steps: the demo follows the talk, one step at a time.
//   →  next step      ←  previous step      Space  run this step
//
// page:    'bridge' (index.html) or 'preact' (preact.html)
// variant: which build: 'default', 'noalias', 'onepreact' (the last two need `npm run demo`)
// run:     action names the page knows how to run
// ask:     shown BEFORE the step runs (never gives the answer away)
// watch:   shown AFTER the step ran (the result)
// spot:    counters to highlight; the others are dimmed (bridge page)
// log:     regex; only matching log lines stay visible during this step

const TRY1 = 'Try 1 · teaching version';
const TRY2 = 'Try 2 · production, Oct–Nov 2025';
const TRY3 = 'Try 3 · production today';
const FIX = 'The fix · tested in this demo';

export const STEPS = [
  { section: TRY1, page: 'bridge', query: { mode: 'naive' },
    run: ['openPicker', 'typeFilter'], title: 'Type in Filter',
    ask: 'The filter is a prop. Will the list follow it?',
    watch: 'The list is not filtered. New props never reach React.',
    log: 'mount|render' },
  { section: TRY1, page: 'bridge', query: { mode: 'naive' },
    run: ['reimportSameRows'], title: 'Re-import, fruit → Cherry',
    ask: 'The form data changes to Cherry. What does the dropdown show?',
    watch: 'Form data says Cherry. The dropdown still says Banana.' },

  { section: TRY2, page: 'bridge', query: { mode: 'sharedKey' },
    run: ['openPicker', 'typeFilter'], title: 'Type in Filter',
    ask: 'Same filter, now with a registry. Watch the list and "opened 1×".',
    watch: 'The list filters, the dropdown stays open: props sync works.', spot: ['rootRenders'],
    log: 'props sync|createRoot' },
  { section: TRY2, page: 'bridge', query: { mode: 'sharedKey' },
    run: ['hideShowSlow'], title: 'Hide/show × 3, slow',
    ask: 'Hide and show the field, slowly, three times.',
    watch: 'Works. Every time: "useEffect ran: cleanup registered".',
    log: 'useEffect ran|cleanup|unmount\\(' },
  { section: TRY2, page: 'bridge', query: { mode: 'sharedKey' },
    run: ['hideShowTimes'], title: 'Hide/show × 10, fast',
    ask: 'The same thing, fast. Watch the field.',
    watch: 'Hidden before useEffect ran → no cleanup → the field stays EMPTY.', spot: ['onScreen'],
    log: 'DETACHED|EMPTY|did not come back|useEffect ran' },

  { section: TRY3, page: 'bridge', query: { mode: 'deferredCheck' },
    run: ['hideShowOnce'], title: 'One slow cycle',
    ask: 'One slow hide and show. The cleanup will run. Will the root be unmounted?',
    watch: 'Cleanup ran, but 150 ms later the div was gone: unmount SKIPPED.', spot: ['unmounted', 'alive'],
    log: 'cleanup|timer|SKIPPED' },
  { section: TRY3, page: 'bridge', query: { mode: 'deferredCheck' },
    run: ['hideShowTimes'], title: 'Hide/show × 10, fast',
    ask: 'Ten fast cycles. How many React roots stay alive?',
    watch: '11 roots alive, 11 document listeners, 1 dropdown on screen: 10 ghosts.', spot: ['alive', 'onScreen', 'listeners'],
    log: 'SKIPPED' },
  { section: TRY3, page: 'bridge', query: { mode: 'deferredCheck', generation: '1' },
    run: ['hideShowTimes'], title: 'Same, with a generation counter',
    ask: 'Now with a generation counter. Will the numbers change?',
    watch: 'Same numbers. The generation counter changes nothing.', spot: ['alive', 'onScreen', 'listeners'],
    log: 'SKIPPED' },
  { section: TRY3, page: 'bridge', query: { mode: 'deferredCheck' },
    run: ['typeNotes'], title: 'Type in Notes',
    ask: 'Type in Notes. React does not use it. Watch root.render().',
    watch: 'React renders again for a field it does not use.', spot: ['rootRenders'],
    log: 'props sync' },

  { section: FIX, page: 'bridge', query: { mode: 'fixed' },
    run: ['hideShowTimes', 'destroy'], title: 'Hide/show × 10, fast, then destroy',
    ask: 'Ten fast cycles, then destroy the whole form.',
    watch: 'Every root is unmounted: alive 0, listeners 0.', spot: ['created', 'unmounted', 'alive', 'listeners'],
    log: 'unmount' },
  { section: FIX, page: 'bridge', query: { mode: 'fixed' },
    run: ['openPicker', 'typeFilter', 'typeNotes'], title: 'Type in Filter, then Notes',
    ask: 'Type in Filter, then in Notes. Watch root.render().',
    watch: 'Filter works, state stays, Notes adds no React render.', spot: ['rootRenders'] },

  { section: 'Preact · lifecycle order', page: 'preact', query: { panel: 'vendored' },
    run: ['lifecycle'], title: 'Mount, then unmount',
    ask: 'Mount a component, then unmount it. Watch "div in DOM".',
    watch: 'Cleanups still see the div. Right after, Preact removes it.' },
  { section: 'Preact · lifecycle order', page: 'preact', query: { panel: 'vendored' },
    run: ['lifecycleFast'], title: 'Unmount before useEffect ran',
    ask: 'Unmount it before useEffect has run.',
    watch: 'useEffect and its cleanup never run.' },

  { section: 'The host\'s own Preact', page: 'preact', query: { panel: 'npm' },
    run: [], title: 'FeelEntry from the npm panel',
    watch: 'Two Preact copies: hooks crash (__H), the properties panel is EMPTY.' },
  { section: 'The host\'s own Preact', page: 'preact', query: { panel: 'vendored' },
    run: ['openRules'], title: 'FeelEntry from the vendored copy',
    ask: 'Same editor, one Preact. Open "Rules".',
    watch: 'The panel and the custom entry render. Type a rule: it is saved.' },
  { section: 'The host\'s own Preact', page: 'preact', variant: 'noalias', query: { panel: 'vendored' },
    run: [], title: 'Build without the Preact alias',
    watch: 'The editor has its own Preact 10.15.1: the editor is BLANK.' },
  { section: 'The host\'s own Preact', page: 'preact', variant: 'onepreact', query: { panel: 'npm' },
    run: ['openRules'], title: 'npm panel + two config lines',
    ask: 'The npm FeelEntry, with two lines of Vite config. Open "Rules".',
    watch: 'It works: no 4,000-line copy needed.' }
];

const FILES = { bridge: 'index.html', preact: 'preact.html' };

/** URL of a step, relative to the current page, keeping ?camera=. */
export function stepUrl(index) {
  const step = STEPS[index];
  const variant = step.variant || 'default';
  const siteRoot = __VARIANT__ === 'default' ? './' : '../';
  const folder = variant === 'default' ? '' : `${variant}/`;
  const query = new URLSearchParams({ ...step.query, step: String(index + 1) });
  const camera = new URLSearchParams(location.search).get('camera');
  if (camera) query.set('camera', camera);
  return `${siteRoot}${folder}${FILES[step.page]}?${query}`;
}

/** In `npm run dev` only the default build exists. */
export function stepAvailable(index) {
  const variant = STEPS[index].variant || 'default';
  return variant === 'default' || !import.meta.env.DEV;
}

/** The step of the current page (from ?step=), or undefined. */
export function currentStep() {
  return STEPS[Number(new URLSearchParams(location.search).get('step')) - 1];
}

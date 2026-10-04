// The presenter steps: the demo follows the talk, one step at a time.
//   →  next step      ←  previous step      Space  run this step
// Each step opens a page (and mode), runs actions, and says what to watch.
//
// page:    'bridge' (index.html) or 'preact' (preact.html)
// variant: which build: 'default', 'noalias', 'onepreact' (the last two need `npm run demo`)
// run:     action names the page knows how to run
// spot:    counters to highlight (bridge page)

export const STEPS = [
  { section: 'Try 1 · one root per instance', page: 'bridge', query: { mode: 'naive' },
    run: ['openPicker', 'typeFilter'], title: 'Type in Filter',
    watch: 'The list is not filtered. New props never reach React.' },
  { section: 'Try 1 · one root per instance', page: 'bridge', query: { mode: 'naive' },
    run: ['reimportSameRows'], title: 'Re-import, fruit → Cherry',
    watch: 'Form data says Cherry. The picker still says Banana.' },

  { section: 'Try 2 · registry keyed by field id', page: 'bridge', query: { mode: 'sharedKey' },
    run: ['openPicker', 'typeFilter'], title: 'Type in Filter',
    watch: 'The list filters, the picker stays open: props sync works.', spot: ['rootRenders'] },
  { section: 'Try 2 · registry keyed by field id', page: 'bridge', query: { mode: 'sharedKey' },
    run: ['hideShowSlow'], title: 'Hide/show × 3, slow',
    watch: 'Works. Each time: "useEffect ran: cleanup registered".' },
  { section: 'Try 2 · registry keyed by field id', page: 'bridge', query: { mode: 'sharedKey' },
    run: ['hideShowTimes'], title: 'Hide/show × 10, fast',
    watch: 'Hidden before useEffect ran → no cleanup → the field stays EMPTY.', spot: ['onScreen'] },

  { section: 'Try 3 · per-instance key + deferred check', page: 'bridge', query: { mode: 'deferredCheck' },
    run: ['hideShowTimes'], title: 'Hide/show × 10, fast',
    watch: 'Nothing is ever unmounted: 11 roots alive, 11 document listeners.', spot: ['alive', 'leaked', 'listeners'] },
  { section: 'Try 3 · per-instance key + deferred check', page: 'bridge', query: { mode: 'deferredCheck', generation: '1' },
    run: ['hideShowTimes'], title: 'Same, with a generation counter',
    watch: 'Same numbers. The generation counter changes nothing.', spot: ['alive', 'leaked', 'listeners'] },
  { section: 'Try 3 · per-instance key + deferred check', page: 'bridge', query: { mode: 'deferredCheck' },
    run: ['typeNotes'], title: 'Type in Notes',
    watch: 'React re-renders for a field it does not use.', spot: ['rootRenders'] },

  { section: 'The fix · refs, layout effects, always unmount', page: 'bridge', query: { mode: 'fixed' },
    run: ['hideShowTimes', 'destroy'], title: 'Hide/show × 10, fast, then destroy',
    watch: 'Every root is unmounted: alive 0, listeners 0.', spot: ['created', 'unmounted', 'alive', 'listeners'] },
  { section: 'The fix · refs, layout effects, always unmount', page: 'bridge', query: { mode: 'fixed' },
    run: ['openPicker', 'typeFilter', 'typeNotes'], title: 'Type in Filter, then Notes',
    watch: 'Filter works, state stays, Notes adds no React render.', spot: ['rootRenders'] },

  { section: 'Preact · lifecycle order', page: 'preact', query: { panel: 'vendored' },
    run: ['lifecycle'], title: 'Mount, then unmount',
    watch: 'Cleanups still see the div. Right after, Preact removes it.' },
  { section: 'Preact · lifecycle order', page: 'preact', query: { panel: 'vendored' },
    run: ['lifecycleFast'], title: 'Unmount before useEffect ran',
    watch: 'useEffect and its cleanup never run.' },

  { section: 'The host\'s own Preact', page: 'preact', query: { panel: 'npm' },
    run: [], title: 'FeelEntry from the npm panel',
    watch: 'Two Preact copies: hooks crash (__H), the properties panel is EMPTY.' },
  { section: 'The host\'s own Preact', page: 'preact', query: { panel: 'vendored' },
    run: ['openRules'], title: 'FeelEntry from the vendored copy',
    watch: 'One Preact: the panel and the custom entry render. Type a rule: it is saved.' },
  { section: 'The host\'s own Preact', page: 'preact', variant: 'noalias', query: { panel: 'vendored' },
    run: [], title: 'Build without the Preact alias',
    watch: 'The editor has its own Preact 10.15.1: the editor is BLANK.' },
  { section: 'The host\'s own Preact', page: 'preact', variant: 'onepreact', query: { panel: 'npm' },
    run: ['openRules'], title: 'npm panel + two config lines',
    watch: 'The npm FeelEntry works: no 4,000-line copy needed.' }
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

# React as a guest: React components inside a Preact host

A small, runnable companion to the talk **"When React Is a Guest: Building Production Components in a Foreign Runtime"**.

[bpmn-io form-js](https://github.com/bpmn-io/form-js) renders forms with **Preact**. This repo puts a **React 19** component inside a custom form-js field. The Preact renderer gives React one empty `<div>`, and React mounts into it with `createRoot`. It shows, live and in tests, what goes wrong with each version of that bridge and what fixes it. A second page shows a problem inside the host itself: **more than one copy of Preact**.

Everything on screen is real behaviour of the pinned versions below. Nothing is simulated except the API: the "fetch" is a local `setTimeout`.

**Live demo:** https://samabaasi.github.io/react-guest-demo/ (built by GitHub Actions from `main`).

## Run it

```bash
npm install        # also generates src/preact-demo/vendored-panel.js
npm run dev        # http://localhost:5173
npm test           # 27 tests, jsdom
npm run demo       # builds all three Vite configs into dist/ and serves http://localhost:4173
```

Open the pages through Vite. Opened directly as files, the browser cannot load their CSS and JavaScript.

## Presenter steps

Both pages share a step bar that follows the talk: 16 steps, each with a short "what to watch" line.
**→** next step, **←** previous step, **Space** runs the step (the pressed button flashes, the counters to watch are outlined).
The bottom-right corner is kept free for a speaker camera; add `?camera=0` to use the full screen.
Steps 15 and 16 use the `noalias` and `onepreact` builds, so they need `npm run demo` (or the live demo).

Two extra Vite configs for the Preact page:

```bash
npm run dev:noalias     # no Preact alias: the form-js editor stays blank
npm run dev:onepreact   # 2 config lines instead of the vendored panel copy
```

Versions (pinned): React 19.2.4, Preact 10.29.1, @bpmn-io/form-js-viewer and form-js-editor 1.21.2, @bpmn-io/properties-panel 3.40.6, Vite 8.0.3.

## Page 1: bridge modes (`/`)

The form has a text field **Filter** (passed to React as a prop), a text field **Notes** (React does not use it), a checkbox **Hide the picker** (a form-js conditional), and **Fruit**, a custom field rendered by the React component `AsyncPicker`. The picker has visible internal state: open/closed, items "fetched", search text and an "opened N×" counter. If its React root is torn down, you see the state reset.

The right side shows **live counters** (roots created / unmounted / alive, pickers on screen / leaked, `document` listeners, `root.render()` calls) and an **event log** with `+ms` timestamps since the last button press.

| Mode | Bridge | What you can show |
|---|---|---|
| **1 · Naive** | `createRoot` in `useEffect`, `root.unmount()` in its cleanup, render once | Lifecycle is clean, no leak. But props never reach React: **Re-import, same rows** sets the form value to *Cherry*, and the picker still shows *Banana*. **Type in Filter** does not filter. |
| **2 · Field-id key** | module `Map` keyed by **field id**, props sync via `root.render()`, cleanup in `useEffect` with `setTimeout(0)` | Props sync works and state survives. **Hide/show × 10, fast** → the field comes back **empty and stays empty**: a new instance got the *old* root, whose div is detached. **Re-import, new row ids** → the same handoff, healed by the next render. |
| **3 · Deferred check** | `Map` keyed by **per-instance id**, cleanup defers 150 ms and unmounts only if `getElementById` still finds the div | No stale root. But Preact removes the div right after the cleanups, so the timer never finds it: **every root leaks**. **Hide/show × 10** → 11 roots alive, 11 `document` listeners. The **generation counter** checkbox changes nothing. **Type in Notes** still re-renders React. |
| **4 · Fixed** | div and root in **refs**, mount/unmount in `useLayoutEffect`, unmount always (one microtask later), sync only the props React uses | No leak, no stale root, state kept, no renders for unrelated fields. |

Buttons: *Type in Filter*, *Type in Notes*, *Hide → show (30 ms)*, *Hide/show × 10, fast* (each step waits only until the DOM changed), *Hide/show × 3, slow* (every `useEffect` has run), *Re-import, same rows*, *Re-import, new row ids* (form-js generates new row keys, so the field is unmounted and mounted in one render), *Destroy form*, *Mount form*. Switching mode reloads the page, so leaked roots from one mode never mix into another.

## Page 2: the host's own Preact (`/preact.html`)

The form-js **editor**, with one custom properties-panel entry ("Visibility rule") built on `FeelEntry`.

- form-js-editor bundles its own properties panel and does **not export `FeelEntry`**, so a custom entry must import it from `@bpmn-io/properties-panel`.
- That npm package imports Preact through relative paths (`'../preact/hooks'`), which point to a **Preact copy bundled inside the package** (10.19.3).
- Preact hooks only work with the Preact copy that renders the component. With the npm `FeelEntry`, the panel crashes: `Cannot read properties of undefined (reading '__H')` in Chrome. Firefox shows `can't access property "__H", X is undefined`, where X is a minified name.
- **Vendored copy:** `scripts/vendor-panel.mjs` copies the package's `dist/index.esm.js` and rewrites its four `'../preact/*'` imports to `'preact/*'`. With it, the entry works.
- **`npm run dev:onepreact`:** a regex alias for `'../preact/*'` plus `optimizeDeps.exclude` does the same job in two lines. Without the `exclude`, the dev server still crashes, because Vite pre-bundles the package and the alias is not applied inside it.
- **`npm run dev:noalias`:** since form-js-editor 1.21.0 the editor depends on `preact <=10.15.1`, so npm installs a separate Preact just for it. Without the Preact `alias`/`dedupe` in `vite.config.js`, the editor renders nothing: `Cannot read properties of undefined (reading 'context')`.

The **Preact lifecycle order** panel shows the timing the bridge depends on:
- `useLayoutEffect` runs before `render()` returns, and `useEffect` runs later.
- On unmount, hook cleanups run while the div is still in the DOM, and the div is removed right after.
- If a component unmounts before its `useEffect` ran, that effect and its cleanup never run.

## Tests

`npm test` runs, in jsdom, with the same packages:

- `test/bridge.test.js`: every bug above (naive: no props sync; field-id key: stale root, permanently empty field; deferred check: leak; generation counter: no difference) and the fixed bridge (no leak, props synced, state kept, no renders for unrelated fields).
- `test/preact.test.js`: Preact cleanup order, effect timing, unmount before `useEffect`, keyed remount, hooks from a second Preact copy.
- `test/react.test.js`: React 19 has no `ReactDOM.render`; `root.render()` is asynchronous; a second `createRoot` on the same div only logs a development error; unmounting a root whose div is gone works.
- `test/editor-npm.test.js`, `test/editor-vendored.test.js`: the real form-js editor with the npm vs the vendored `FeelEntry`.

Timing notes. These effects depend on real scheduling. The "fast" sequences wait for DOM changes, not fixed delays. Tests run one file at a time (`fileParallelism: false`) so a busy machine does not merge Preact renders. jsdom has no `IntersectionObserver`; `test/setup.js` adds an empty stand-in for the properties panel.

## Layout

```
src/bridge/       the four bridge modes, form-js field module, instrumentation
src/react/        AsyncPicker (React) and a local fake API
src/demo/         page 1 UI and the scenarios shared with the tests
src/preact-demo/  page 2: editor entry, lifecycle demo, generated vendored panel
scripts/          vendor-panel.mjs
test/             vitest suites
```

## License

MIT. `src/preact-demo/vendored-panel.js` is generated from `@bpmn-io/properties-panel` (MIT, bpmn.io) and is not committed.

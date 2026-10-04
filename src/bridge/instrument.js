// Live counters and an event log, so every bridge mode can be compared on screen
// and in tests. Nothing here changes behaviour; it only observes.
import { createRoot as reactCreateRoot } from 'react-dom/client';

export const stats = {
  rootsCreated: 0,
  rootsUnmounted: 0,
  rootRenders: 0,
  pickersMounted: 0,
  pickersUnmounted: 0,
  documentListeners: 0
};

export const events = [];
const listeners = new Set();
let t0 = performance.now();
let rootSeq = 0;

/** Restart the "+ms" clock, e.g. when the user presses a demo button. */
export function markAction(label) {
  t0 = performance.now();
  log('action', label);
}

/**
 * @param {'action'|'preact'|'react'|'timer'|'bug'|'ok'} kind
 * @param {string} message
 */
export function log(kind, message) {
  const entry = { t: Math.round(performance.now() - t0), kind, message };
  events.push(entry);
  if (events.length > 500) events.shift();
  listeners.forEach((fn) => fn(entry));
}

export function onEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetInstrumentation() {
  for (const key of Object.keys(stats)) stats[key] = 0;
  events.length = 0;
  rootSeq = 0;
  t0 = performance.now();
}

/** createRoot() that counts roots, renders and unmounts. */
export function createRoot(container) {
  const id = ++rootSeq;
  stats.rootsCreated++;
  log('react', `createRoot #${id} on <div id="${container.id || '(no id)'}">`);
  const root = reactCreateRoot(container);
  const render = root.render.bind(root);
  const unmount = root.unmount.bind(root);
  root.render = (element) => {
    stats.rootRenders++;
    render(element);
  };
  root.unmount = () => {
    stats.rootsUnmounted++;
    log('react', `root #${id}.unmount()`);
    unmount();
  };
  root.id = id;
  root.container = container;
  return root;
}

export function liveRoots() {
  return stats.rootsCreated - stats.rootsUnmounted;
}

export function livePickers() {
  return stats.pickersMounted - stats.pickersUnmounted;
}

import { createNaiveBridge } from './naive.js';
import { createSharedKeyBridge, resetSharedKeyRegistry } from './sharedKey.js';
import { createDeferredCheckBridge, resetDeferredCheckRegistry } from './deferredCheck.js';
import { createFixedBridge } from './fixed.js';

export const MODES = {
  naive: {
    tab: '1 · Naive',
    title: '1 · Naive: root per instance',
    summary: 'Clean lifecycle, but React only gets the first props.',
    create: (Component) => createNaiveBridge(Component)
  },
  sharedKey: {
    tab: '2 · Field-id key',
    title: '2 · Registry keyed by field id',
    summary: 'Props sync works. But a new instance can get an OLD root: after a fast hide/show the field stays empty.',
    create: (Component) => createSharedKeyBridge(Component)
  },
  deferredCheck: {
    tab: '3 · Deferred check',
    title: '3 · Per-instance key + deferred DOM check',
    summary: 'No stale root. But the timer never finds the div, so roots leak.',
    create: (Component, { generation } = {}) => createDeferredCheckBridge(Component, { generation })
  },
  fixed: {
    tab: '4 · Fixed',
    title: '4 · Fixed: refs + always unmount',
    summary: 'One root per instance, synced props, unmount every time.',
    create: (Component) => createFixedBridge(Component)
  }
};

export function resetRegistries() {
  resetSharedKeyRegistry();
  resetDeferredCheckRegistry();
}

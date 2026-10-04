// Mode 2 - Registry keyed by field id.
// A module-level Map finds "the root for this field", so prop changes re-render
// the same root instead of creating a new one. But the key is the FIELD id,
// which every Preact instance of that field shares. A new instance can find
// the OLD root, whose div is already detached, and render into it:
//   * remount in one render (re-import with new row ids): empty until the
//     next render creates a fresh root;
//   * hidden before its useEffect ran (fast hide/show): the cleanup was never
//     registered, the old root is never removed, and the field stays empty.
import { useEffect, useLayoutEffect } from 'preact/hooks';
import { createRoot, log } from './instrument.js';
import { fieldShell, reactElement, toReactProps } from './shared.js';

const roots = new Map();

export function resetSharedKeyRegistry() {
  roots.clear();
}

export function createSharedKeyBridge(Component) {
  return function SharedKeyBridge(props) {
    const { field, value, onChange, disabled, readonly, errors, formData } = props;
    const containerId = `bridge-${field.id}`;

    useLayoutEffect(() => {
      const container = document.getElementById(containerId);
      if (!container) return;

      const element = reactElement(Component, toReactProps(props, (v) => onChange({ field, value: v })));
      const entry = roots.get(containerId);

      if (!entry) {
        const root = createRoot(container);
        root.render(element);
        roots.set(containerId, { root, container });
        return;
      }

      if (entry.container !== container) {
        log('bug', `found root #${entry.root.id}, but its div is ${entry.container.isConnected ? 'another node' : 'DETACHED'} - rendering there, new div stays empty`);
        setTimeout(() => {
          log(container.childElementCount ? 'ok' : 'bug', `new div is ${container.childElementCount ? 'filled' : 'still EMPTY'}`);
        }, 0);
      } else {
        log('preact', `props sync: root #${entry.root.id}.render()`);
      }
      entry.root.render(element);
    }, [containerId, field, value, onChange, disabled, readonly, errors, formData]);

    // Cleanup lives in useEffect. Preact runs useEffect after paint; if the field
    // is unmounted before that, this effect never runs and there is no cleanup:
    // the Map keeps the old root forever.
    useEffect(() => {
      log('preact', `useEffect ran: cleanup registered for ${containerId}`);
      return () => {
        log('preact', `cleanup ${containerId}: unmount scheduled (setTimeout 0)`);
        setTimeout(() => {
          const entry = roots.get(containerId);
          log('timer', `timer for ${containerId}: ${entry ? `unmount root #${entry.root.id} and forget it` : 'nothing to do'}`);
          if (entry) {
            entry.root.unmount();
            roots.delete(containerId);
          }
        }, 0);
      };
    }, [containerId]);

    return fieldShell(props, { id: containerId });
  };
}

// Mode 4 - Fixed bridge.
// No global Map, no getElementById, no timers to guess.
//   * The div is a ref, the root is a ref: one root per Preact instance.
//   * Props sync only when a prop React uses has changed.
//   * Unmount always happens. It is deferred by one microtask so it never
//     runs in the middle of a React render.
import { useCallback, useLayoutEffect, useRef } from 'preact/hooks';
import { createRoot, log } from './instrument.js';
import { fieldShell, reactElement, toReactProps } from './shared.js';

export function createFixedBridge(Component) {
  return function FixedBridge(props) {
    const slot = useRef(null);
    const rootRef = useRef(null);

    // The callback React receives never changes; it always calls the latest onChange.
    const latest = useRef(props);
    latest.current = props;
    const onChange = useCallback((value) => {
      latest.current.onChange({ field: latest.current.field, value });
    }, []);

    // 1. Mount and unmount: tied to this Preact instance.
    useLayoutEffect(() => {
      const root = createRoot(slot.current);
      rootRef.current = root;
      return () => {
        rootRef.current = null;
        log('preact', `cleanup: root #${root.id}.unmount() in a microtask`);
        queueMicrotask(() => root.unmount());
      };
    }, []);

    // 2. Props sync: only what the React component actually uses.
    const { label, value, filter, disabled } = toReactProps(props, onChange);
    useLayoutEffect(() => {
      rootRef.current.render(reactElement(Component, { label, value, filter, disabled, onChange }));
    }, [label, value, filter, disabled, onChange]);

    return fieldShell(props, { ref: slot });
  };
}

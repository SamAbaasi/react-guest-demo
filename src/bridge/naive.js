// Mode 1 - Naive: one React root per Preact instance, created once.
// Lifecycle is correct (mount -> createRoot, unmount -> root.unmount()),
// but React only ever sees the props from the first render.
import { useEffect, useRef } from 'preact/hooks';
import { createRoot, log } from './instrument.js';
import { fieldShell, reactElement, toReactProps } from './shared.js';

export function createNaiveBridge(Component) {
  return function NaiveBridge(props) {
    const slot = useRef(null);

    useEffect(() => {
      const root = createRoot(slot.current);
      const onChange = (value) => props.onChange({ field: props.field, value });
      root.render(reactElement(Component, toReactProps(props, onChange)));
      log('preact', 'mount: rendered once - later prop changes never reach React');

      return () => {
        log('preact', 'cleanup: root.unmount() now');
        root.unmount();
      };
    }, []);

    return fieldShell(props, { ref: slot });
  };
}

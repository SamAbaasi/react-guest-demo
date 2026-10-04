// Mode 3 - Per-instance key, deferred unmount with a DOM check.
// Each Preact instance gets its own id, so a new instance never meets an old
// root. Cleanup is deferred and only unmounts if the div is still in the DOM.
//
// The problem: Preact runs hook cleanups first and removes the div right after.
// By the time the timer fires, the div is always gone, so root.unmount()
// never runs. Every unmounted field leaks its React tree and its listeners.
//
// `generation: true` adds a generation counter. It changes nothing here,
// because a container id is never reused - the demo shows that.
import { useContext, useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { FormContext } from '@bpmn-io/form-js-viewer';
import { createRoot, log } from './instrument.js';
import { fieldShell, prefixId, reactElement, toReactProps } from './shared.js';

const roots = new Map();
let instanceSeq = 0;

export function resetDeferredCheckRegistry() {
  roots.clear();
}

export function createDeferredCheckBridge(Component, { generation = false, delay = 150 } = {}) {
  return function DeferredCheckBridge(props) {
    const { field, value, onChange, disabled, readonly, errors, formData } = props;
    const { formId } = useContext(FormContext);
    const instanceId = useRef(`instance-${++instanceSeq}`).current;
    const containerId = `${prefixId(field.id, formId)}-bridge-${instanceId}`;

    const onChangeRef = useRef(onChange);
    const fieldRef = useRef(field);
    useEffect(() => {
      onChangeRef.current = onChange;
      fieldRef.current = field;
    });

    useLayoutEffect(() => {
      const container = document.getElementById(containerId);
      if (!container) return;

      const element = reactElement(Component, toReactProps(props, (v) => {
        onChangeRef.current({ field: fieldRef.current, value: v });
      }));
      const entry = roots.get(containerId);

      if (!entry) {
        const root = createRoot(container);
        root.render(element);
        roots.set(containerId, { root, mounted: true, generation: 1 });
        log('preact', `${instanceId} mounted`);
      } else {
        entry.mounted = true;
        if (generation) entry.generation += 1;
        log('preact', `${instanceId} props sync: root #${entry.root.id}.render()${generation ? ` (generation ${entry.generation})` : ''}`);
        entry.root.render(element);
      }
    }, [containerId, field, value, onChange, disabled, readonly, errors, formData, instanceId]);

    // Like production, cleanup lives in useEffect. If Preact unmounts the field
    // before it has run this effect, there is no cleanup at all.
    useEffect(() => {
      log('preact', `${instanceId} useEffect ran: cleanup registered`);
      return () => {
        const entry = roots.get(containerId);
        if (!entry) return;
        entry.mounted = false;
        const captured = entry.generation;
        log('preact', `${instanceId} cleanup: div in DOM = ${!!document.getElementById(containerId)}, unmount in ${delay} ms`);

        setTimeout(() => {
          const current = roots.get(containerId);
          const sameGeneration = !generation || (current && current.generation === captured);
          if (!current || current.mounted || !sameGeneration) {
            log('timer', `${instanceId} timer: skipped (remounted)`);
            return;
          }
          const stillThere = document.getElementById(containerId);
          if (stillThere && stillThere.parentNode) {
            current.root.unmount();
          } else {
            log('bug', `${instanceId} timer: div in DOM = false -> root #${current.root.id}.unmount() SKIPPED (leak)`);
          }
          roots.delete(containerId);
        }, delay);
      };
    }, [containerId]);

    return fieldShell(props, { id: containerId });
  };
}

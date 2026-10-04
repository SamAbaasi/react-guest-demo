// Small helpers shared by all bridge modes (Preact side).
import { h } from 'preact';
import { createElement } from 'react';
import { Label, Errors } from '@bpmn-io/form-js-viewer';

export function prefixId(id, formId) {
  return formId ? `fjs-form-${formId}-${id}` : `fjs-form-${id}`;
}

/** Props that cross the boundary: Preact/form-js props in, React props out. */
export function toReactProps(props, onChange) {
  const { field, value, disabled, readonly, formData = {} } = props;
  return {
    label: field.label,
    value: value ?? '',
    filter: formData.filter ?? '',
    disabled: !!(disabled || readonly),
    onChange
  };
}

export function reactElement(Component, reactProps) {
  return createElement(Component, reactProps);
}

/**
 * The Preact markup: form-js owns the label and the errors,
 * React owns exactly one empty div (the "surrendered" div).
 */
export function fieldShell(props, slotAttributes) {
  const { field, errors = [] } = props;
  // The label gets its own id: Label renders it on the <label>, and the slot
  // id must be unique, or getElementById would return the label.
  return h('div', { class: 'fjs-form-field bridge-field' },
    h(Label, { id: `${slotAttributes.id || field.id}-label`, label: field.label }),
    h('div', { class: 'bridge-slot', ...slotAttributes }),
    h(Errors, { errors, id: `${field.id}-errors` })
  );
}

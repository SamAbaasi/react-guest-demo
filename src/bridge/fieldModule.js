// Registers a custom form-js field type ("asyncPicker") whose renderer is one
// of the bridge modes. The wrapper keeps the whole form data in Preact state,
// so the React component can react to other fields (the "filter" prop).
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

export const PICKER_TYPE = 'asyncPicker';

export function createPickerModule(BridgeRenderer) {
  class PickerField {
    constructor(formFields, eventBus) {
      let latestData = {};
      const subscribers = new Set();

      eventBus.on('changed', (event) => {
        const data = event.data || {};
        latestData = { ...data };
        subscribers.forEach((set) => set({ ...data }));
      });

      function PickerFieldRenderer(props) {
        const [formData, setFormData] = useState(() => ({ ...latestData }));
        useEffect(() => {
          subscribers.add(setFormData);
          return () => subscribers.delete(setFormData);
        }, []);
        return h(BridgeRenderer, { ...props, formData });
      }

      PickerFieldRenderer.config = {
        type: PICKER_TYPE,
        label: 'Async picker',
        group: 'selection',
        keyed: true,
        emptyValue: '',
        create: (options = {}) => ({ type: PICKER_TYPE, ...options })
      };

      formFields.register(PICKER_TYPE, PickerFieldRenderer);
    }
  }
  PickerField.$inject = ['formFields', 'eventBus'];

  return { __init__: ['pickerField'], pickerField: ['type', PickerField] };
}

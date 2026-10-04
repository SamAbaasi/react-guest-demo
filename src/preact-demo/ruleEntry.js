// A custom properties-panel entry, written the way the form-js editor allows:
// the editor bundles its own panel and does not export FeelEntry, so the entry
// has to import FeelEntry from somewhere else.
import { useService, useVariables } from '@bpmn-io/form-js-editor';

export function createRuleModule(FeelEntry) {
  function VisibilityRule(props) {
    const { field, id, getValue, setValue } = props;
    const debounce = useService('debounce') ?? ((fn) => fn);
    const variables = useVariables()?.map((name) => ({ name })) ?? [];

    // FeelEntry's hooks come from whatever Preact FeelEntry was built against.
    return FeelEntry({
      debounce,
      element: field,
      feel: 'required',
      getValue,
      id,
      label: 'Visibility rule',
      setValue,
      variables
    });
  }

  class RulesProvider {
    constructor(propertiesPanel) {
      propertiesPanel.registerProvider(this, 500);
    }

    getGroups(field, editField) {
      return (groups) => {
        if (field.type !== 'textfield') return groups;
        groups.push({
          id: 'rules',
          label: 'Rules',
          entries: [{
            id: 'visibility-rule',
            component: VisibilityRule,
            field,
            getValue: () => field.rule || '',
            setValue: (value) => editField(field, ['rule'], value),
            isEdited: () => !!field.rule
          }]
        });
        return groups;
      };
    }
  }
  RulesProvider.$inject = ['propertiesPanel'];

  return { __init__: ['rulesProvider'], rulesProvider: ['type', RulesProvider] };
}

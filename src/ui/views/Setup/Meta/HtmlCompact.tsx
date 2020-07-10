import registry from '../Registry';

registry.register('Root', undefined, null);
registry.register('Object', undefined, null);
registry.register('Array', undefined, null);
registry.register('Map', undefined, null);

registry.register('Field', undefined, null);
registry.register('LabelContainer', undefined, null);
registry.register('LabelView', undefined, 'label', ['View']);
registry.register('ValueContainer', undefined, null);
registry.register('ValueInput', undefined, 'input', ['Input']);

import register from '../Registry';

register.register('Object', undefined, null);
register.register('Array', undefined, null);
register.register('Map', undefined, null);
register.register('Field', undefined, null);
register.register('LabelContainer', undefined, null);
register.register('LabelView', undefined, 'label', ['View']);
register.register('ValueContainer', undefined, null);
register.register('ValueInput', 'map', null);
register.register('ValueInput', undefined, 'input', ['Input']);

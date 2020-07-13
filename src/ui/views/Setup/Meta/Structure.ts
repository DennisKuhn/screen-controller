import registry from '../Registry';
import ObjectForm from '../ObjectForm';
import ArrayInput from '../ArrayInput';
import MapInput from '../MapInput';

registry.register('ValueInput', 'array', ArrayInput, ['Base', 'Input', 'Property']);
registry.register('ValueInput', 'map', MapInput, ['Base', 'Input', 'Property']);
registry.register('ValueInput', 'object', ObjectForm, ['Base', 'Input']);

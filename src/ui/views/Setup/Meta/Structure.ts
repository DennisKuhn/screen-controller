import registry from '../Registry';
import Form from '../RootForm';
import ArrayInput from '../ArrayInput';
import MapInput from '../MapInput';

registry.register('ValueInput', 'array', ArrayInput, ['Base', 'Input', 'Property']);
registry.register('ValueInput', 'map', MapInput, ['Base', 'Input', 'Property']);
registry.register('ValueInput', 'object', Form, ['Input']);

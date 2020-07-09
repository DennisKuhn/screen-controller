import registry from '../Registry';
import Form from '../Form';
import ArrayInput from '../ArrayInput';
import MapInput from '../MapInput';

registry.register('ValueInput', 'array', ArrayInput, ['Base', 'Input']);
registry.register('ValueInput', 'map', MapInput, ['Base', 'Input']);
registry.register('ValueInput', 'object', Form, ['Input']);

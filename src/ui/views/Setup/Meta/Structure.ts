import registry from '../Registry';
import Form from '../Form';
import { ArrayInput } from '../SetupObject';

registry.register('ValueInput', 'array', ArrayInput, ['Base', 'Input']);
registry.register('ValueInput', 'object', Form, ['Input']);

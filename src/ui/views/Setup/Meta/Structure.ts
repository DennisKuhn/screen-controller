import registry, { Props } from '../Registry';
import Form from '../Form';

registry.register('ValueInput', 'array', null);
registry.register('ValueInput', 'object', Form, Props.Input);

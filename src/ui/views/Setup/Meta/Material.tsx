import { Typography, Input } from '@material-ui/core';
import GridContainer from '../../../components/Grid/GridContainer';
import GridContainerItem from '../../../components/Grid/GridContainerItem';
import GridItem from '../../../components/Grid/GridItem';
import registry from '../Registry';


registry.register('Root', undefined, null);
registry.register('Object', undefined, GridContainer, ['None']);
registry.register('Array', undefined, GridContainer, ['None']);
registry.register('Map', undefined, GridContainer, ['None']);

registry.register('Field', undefined, GridContainerItem, ['None']);
registry.register('LabelContainer', undefined, GridItem, ['None']);
registry.register('LabelView', undefined, Typography, ['View']);
registry.register('ValueContainer', undefined, GridItem, ['None']);
registry.register('ValueInput', undefined, Input, ['Input']);

import { Typography, Input } from '@material-ui/core';
import GridContainer from '../../../components/Grid/GridContainer';
import GridContainerItem from '../../../components/Grid/GridContainerItem';
import GridItem from '../../../components/Grid/GridItem';
import register from '../Registry';


register.register('Object', undefined, GridContainer, ['None']);
register.register('Array', undefined, GridContainer, ['None']);
register.register('Map', undefined, GridContainer, ['None']);

register.register('Field', undefined, GridContainerItem, ['None']);
register.register('LabelContainer', undefined, GridItem, ['None']);
register.register('LabelView', undefined, Typography, ['View']);
register.register('ValueContainer', undefined, GridItem, ['None']);
register.register('ValueInput', undefined, Input, ['Input']);

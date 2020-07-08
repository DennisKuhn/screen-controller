import { Typography, Input } from '@material-ui/core';
import GridContainer from '../../../components/Grid/GridContainer';
import GridContainerItem from '../../../components/Grid/GridContainerItem';
import GridItem from '../../../components/Grid/GridItem';
import register, { Props } from '../Registry';
// import Typography from '../Typography/Typography';


register.register('Object', undefined, GridContainer, Props.None);
register.register('Field', undefined, GridContainerItem, Props.None);
register.register('LabelContainer', undefined, GridItem, Props.None);
register.register('LabelView', undefined, Typography, Props.View);
register.register('ValueContainer', undefined, GridItem, Props.None);
register.register('ValueInput', undefined, Input, Props.Input);

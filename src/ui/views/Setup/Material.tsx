import { TextField, Typography } from '@material-ui/core';
import React from 'react';
import GridContainer from '../../components/Grid/GridContainer';
import GridContainerItem from '../../components/Grid/GridContainerItem';
import GridItem from '../../components/Grid/GridItem';
import register, { PropertyProps, Props } from './Registry';
// import Typography from '../Typography/Typography';

const NumberField = (props: PropertyProps): JSX.Element =>  <TextField type='number' {...props } />;

register.register('Object', undefined, GridContainer, Props.None);
register.register('Field', undefined, GridContainerItem, Props.None);
register.register('LabelContainer', undefined, GridItem, Props.None);
register.register('LabelView', undefined, Typography, Props.View);
register.register('ValueContainer', undefined, GridItem, Props.None);
register.register('ValueInput', 'number', NumberField, Props.Input);
register.register('ValueInput', 'string', TextField, Props.Input);
register.register('ValueInput', undefined, TextField, Props.Input);

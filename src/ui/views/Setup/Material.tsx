import { TextField, Typography } from '@material-ui/core';
import React from 'react';
import GridContainer from '../../components/Grid/GridContainer';
import GridContainerItem from '../../components/Grid/GridContainerItem';
import GridItem from '../../components/Grid/GridItem';
import register, { PropertyProps } from './Registry';
// import Typography from '../Typography/Typography';

const NumberField = (props: PropertyProps): JSX.Element =>  <TextField type='number' {...props } />;

register.register('Object', undefined, GridContainer);
register.register('Field', undefined, GridContainerItem);
register.register('LabelContainer', undefined, GridItem);
register.register('LabelView', undefined, Typography);
register.register('ValueContainer', undefined, GridItem);
register.register('ValueInput', 'number', NumberField);
register.register('ValueInput', undefined, TextField);

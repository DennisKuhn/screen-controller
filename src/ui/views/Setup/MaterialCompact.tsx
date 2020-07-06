import { TextField } from '@material-ui/core';
import React from 'react';
import { callerAndfName } from '../../../utils/debugging';
import register, { PropertyProps } from './Registry';

const NumberField = (props: PropertyProps): JSX.Element => <TextField type='number' {...props} />;

console.log(`${callerAndfName()} Register`);

register.register('Object', undefined, null);
register.register('Field', undefined, null);
register.register('LabelContainer', undefined, null);
register.register('LabelView', undefined, null);
register.register('ValueContainer', undefined, null);
register.register('ValueInput', 'number', NumberField);
register.register('ValueInput', undefined, TextField);

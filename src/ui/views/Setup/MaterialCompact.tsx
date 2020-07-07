import { TextField, Input } from '@material-ui/core';
// import React from 'react';
import { callerAndfName } from '../../../utils/debugging';
import registry, { Props } from './Registry';

console.log(`${callerAndfName()} Register`);

registry.register('Object', undefined, null);
registry.register('Field', undefined, null);
registry.register('LabelContainer', undefined, null);
registry.register('LabelView', undefined, null);
registry.register('ValueContainer', undefined, null);
registry.register('ValueInput', 'number', TextField, Props.Input | Props.Label);
registry.register('ValueInput', 'string', TextField, Props.Input | Props.Label);
registry.register('ValueInput', undefined, Input, Props.Input);

//TODO: Should produce compiler error register('ValueInput' ... | Props.View);
//registry.register('ValueInput', undefined, TextField, Props.Input | Props.Label | Props.View);

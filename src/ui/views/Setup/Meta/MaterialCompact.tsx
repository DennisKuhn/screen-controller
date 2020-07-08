import React from 'react';
import { TextField, Input } from '@material-ui/core';
import { callerAndfName } from '../../../../utils/debugging';
import registry, { Props, InputProps, LabelProps } from '../Registry';

console.log(`${callerAndfName()} Register`);

const TextFieldHoc = (props: LabelProps & InputProps): JSX.Element => {
    const { readOnly, value, label, type, onChange } = props;
    return <TextField
        label={label}
        value={value}
        type={type}
        onChange={onChange}
        InputProps={{
            readOnly,
        }}
    />;
}

registry.register('Object', undefined, null);
registry.register('Field', undefined, null);
registry.register('LabelContainer', undefined, null);
registry.register('LabelView', undefined, null);
registry.register('ValueContainer', undefined, null);
registry.register('ValueInput', 'number', TextFieldHoc, Props.Input | Props.Label);
registry.register('ValueInput', 'string', TextFieldHoc, Props.Input | Props.Label);
registry.register('ValueInput', undefined, Input, Props.Input);

//TODO: Should produce compiler error register('ValueInput' ... | Props.View);
//registry.register('ValueInput', undefined, TextField, Props.Input | Props.Label | Props.View);

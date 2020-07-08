import React from 'react';
import { TextField, Input, FormControlLabel, Switch } from '@material-ui/core';
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
};

const SwitchHoc = (props: LabelProps & InputProps): JSX.Element => {
    if (typeof props.value != 'boolean') throw new Error(`${callerAndfName()} typeof value=${typeof props.value} must be boolean`);

    return <FormControlLabel
        value="top"
        control={<Switch
            checked={props.value}
            onChange={props.onChange}
            color="primary"
            readOnly={props.readOnly}
        />}
        label={props.label}
        labelPlacement="top"
    />;
};

registry.register('Object', undefined, null);
registry.register('Array', undefined, null);
registry.register('Map', undefined, null);
registry.register('Field', undefined, null);
registry.register('LabelContainer', undefined, null);
registry.register('LabelView', undefined, null);
registry.register('ValueContainer', undefined, null);
registry.register('ValueInput', 'number', TextFieldHoc, Props.Input | Props.Label);
registry.register('ValueInput', 'string', TextFieldHoc, Props.Input | Props.Label);
registry.register('ValueInput', 'checkbox', SwitchHoc, Props.Input | Props.Label);
registry.register('ValueInput', 'array', null);
registry.register('ValueInput', 'map', null);
registry.register('ValueInput', undefined, Input, Props.Input);

//TODO: Should produce compiler error register('ValueInput' ... | Props.View);
//registry.register('ValueInput', undefined, TextField, Props.Input | Props.Label | Props.View);
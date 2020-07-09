import React from 'react';
import { TextField, Input, Switch, FormControl, InputLabel } from '@material-ui/core';
import { callerAndfName } from '../../../../utils/debugging';
import registry, { InputProps, LabelProps } from '../Registry';

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

    return (
        <FormControl>
            <InputLabel shrink={props.value !== undefined}>{props.label}</InputLabel>
            <Switch
                checked={props.value}
                onChange={props.onChange}
                color="primary"
                readOnly={props.readOnly}
            />
        </FormControl>);
};

registry.register('Object', undefined, null);
registry.register('Array', undefined, null);
registry.register('Map', undefined, null);

registry.register('Field', undefined, null);
registry.register('LabelContainer', undefined, null);
registry.register('LabelView', undefined, null);
registry.register('ValueContainer', undefined, null);
registry.register('ValueInput', 'number', TextFieldHoc, ['Input', 'Label']);
registry.register('ValueInput', 'string', TextFieldHoc, ['Input', 'Label']);
registry.register('ValueInput', 'checkbox', SwitchHoc, ['Input', 'Label']);
registry.register('ValueInput', undefined, Input, ['Input']);


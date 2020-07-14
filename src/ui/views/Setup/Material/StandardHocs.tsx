import { makeStyles, TextField, FormControl, InputLabel, Switch, MenuItem } from '@material-ui/core';
import React from 'react';
import { BaseProps, LabelProps, InputProps } from '../PropTypes';
import { callerAndfName } from '../../../../utils/debugging';
import { ExtendedTheme } from '../../../assets/Theme';

const useStyles = makeStyles((theme: ExtendedTheme) => ({
    ...theme.columnDefaults,
    switch: {
        marginTop: theme.spacing(2)
    },
}));

export const TextFieldHoc = (props: LabelProps & InputProps): JSX.Element => {
    const classes = useStyles();

    return <TextField
        className={classes.defaultField}
        label={props.label}
        value={props.value}
        type={props.type}
        onChange={props.onChange}
        InputProps={{ readOnly: props.readOnly }}
    />;
};

export const SwitchHoc = (props: LabelProps & InputProps): JSX.Element => {
    if (!((typeof props.value == 'boolean') || (typeof props.value == 'undefined')))
        throw new Error(`${callerAndfName()} typeof value=${typeof props.value} must be boolean or undefined`);
    const classes = useStyles();

    return (
        <FormControl>
            <InputLabel shrink={props.value !== undefined}>{props.label}</InputLabel>
            <Switch
                className={classes.switch}
                checked={props.value}
                onChange={props.onChange}
                color="primary"
                readOnly={props.readOnly}
            />
        </FormControl>);
};


export const SelectHoc = (props: BaseProps & LabelProps & InputProps): JSX.Element => {
    const classes = useStyles();

    return (
        <TextField
            className={classes.defaultField}
            label={props.label}
            value={props.value}
            type={props.type}
            onChange={props.onChange}
            InputProps={{ readOnly: props.readOnly }}
            select={true}                
            >
            {props.schema.enum?.map((entry, index) => {
                switch (typeof entry) {
                    case 'string':
                    case 'number':
                        return <MenuItem key={index} value={entry}>{entry}</MenuItem>;
                        break;
                    default:
                        throw new Error(`${callerAndfName()} typeof enum entry=${typeof entry} is not supported yet`);
                }
            }
            )}
        </TextField>
    );
};

import React from 'react';
import { TextField, InputAdornment, TextFieldProps, makeStyles } from '@material-ui/core';

export const useStyles = makeStyles((reqtheme) => ({
    coordField: {
        width: 65,
    },
}));

export function PercentField(props: TextFieldProps): React.ReactElement {
    const classes = useStyles();
    return (
        <TextField
            {...{
                ...props,
                value: (Number(props.value) * 100),
                onChange: ((e): void => props.onChange && props.onChange({ ...e, target: { ...e.target, value: (Number(e.target.value) / 100).toPrecision() } }))
            }}
            type='number'
            className={classes.coordField}
            InputProps={{
                endAdornment: <InputAdornment position='end'>%</InputAdornment>
            }} InputLabelProps={{
                shrink: true,
            }}
        />
    );
}

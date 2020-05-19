import React from 'react';
import { TextField, InputAdornment, TextFieldProps, makeStyles } from '@material-ui/core';

export const useStyles = makeStyles((theme) => ({
    coordField: {
        width: 65,
    },
}));

export function PercentField(props: TextFieldProps): React.ReactElement {
    const classes = useStyles();
    return <TextField {...props} type='number' className={classes.coordField} InputProps={{
        endAdornment: <InputAdornment position='end'>%</InputAdornment>
    }} InputLabelProps={{
        shrink: true,
    }} />;
}

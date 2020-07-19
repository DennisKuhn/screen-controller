import React from 'react';
import { TextField, InputAdornment, TextFieldProps, makeStyles } from '@material-ui/core';

export const useStyles = makeStyles((reqtheme) => ({
    coordField: {
        width: 55,
    },
    adorment: {
        marginLeft: 0,
    }
}));

// schema: {
//     ...schema,
//     ...(typeof schema.default == 'number' ? { default: schema.default * 100 } : {}),
//     ...(typeof schema.maximum == 'number' ? { maximum: schema.maximum * 100 } : {}),
//     ...(typeof schema.minimum == 'number' ? { minimum: schema.minimum * 100 } : {}),
//     ...(typeof schema.exclusiveMaximum == 'number' ? { exclusiveMaximum: schema.exclusiveMaximum * 100 } : {}),
//     ...(typeof schema.exclusiveMinimum == 'number' ? { exclusiveMinimum: schema.exclusiveMinimum * 100 } : {}),
//     ...(typeof schema.multipleOf == 'number' ? { multipleOf: schema.multipleOf * 100 } : {})
// }

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
                endAdornment: <InputAdornment className={classes.adorment} position='end'>%</InputAdornment>
            }} InputLabelProps={{
                shrink: true,
            }}
        />
    );
}

import { FormControl as MuiFormControl, FormControlProps, FormHelperText, InputLabel } from '@material-ui/core';
import NotchedOutline from '@material-ui/core/OutlinedInput/NotchedOutline';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';

const useStyles = makeStyles((theme) => ({
    root: {
        padding: theme.spacing(1),
        display: 'flex',
        flexWrap: 'wrap'
    },
    notchedOutline: {},
    notchedOutlineError: {
        borderColor: theme.palette.error.main
    },
    container: {}
}));

interface NotchedOutlineContainerProps extends FormControlProps {
    label?: string;
    helperText?: string;
    dense?: boolean;
}

const NotchedOutlineContainer = ({ children, label, helperText, dense, error, ...props }: NotchedOutlineContainerProps): JSX.Element => {
    const classes = useStyles();
    return (
        <MuiFormControl
            margin="normal"
            // fullWidth={true}
            variant="outlined"
            error={error}
            {...props}
            >
            <div className={clsx('MuiOutlinedInput-root', { 'Mui-error': error, 'Mui-disabled': props.disabled, [classes.root]: !dense })}>
                {label && (
                    <InputLabel shrink={true}>{label}</InputLabel>
                )}
                {children}
                <NotchedOutline
                    disabled={props.disabled}
                    className={clsx(classes.notchedOutline, 'MuiOutlinedInput-notchedOutline')}
                    labelWidth={0}
                    notched={true} {...{ label: `${label} x` } as any}>
                </NotchedOutline>
            </div>
            {helperText && (
                <FormHelperText error={error} variant="outlined">
                    {helperText}
                </FormHelperText>
            )}
        </MuiFormControl>
    );
};

export default NotchedOutlineContainer;
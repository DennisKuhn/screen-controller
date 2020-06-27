import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { callerAndfName } from '../../../utils/debugging';
import { WidgetProps } from '@rjsf/core';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            '& > *': {
                margin: theme.spacing(1),
            },
        },
        input: {
            display: 'none',
        },
    }),
);


const OpenFile = (props: WidgetProps): JSX.Element => {
    const classes = useStyles();

    return (< >
        <input
            accept="image/*"
            className={classes.input}
            id="contained-button-file"
            multiple={false}
            type="file"
            onChange={(e): void => props.onChange(e.target.value) }
        />
        <label htmlFor="contained-button-file" >
            <Button variant="contained" color="primary" component="span" >
                Select
            </Button>
        </label>
    </ >
    );
    //     return (
    //         <button id= "custom" className = { props.value ? "checked" : "unchecked" } onClick = {() => props.onChange(!props.value)}>
    //             { String(props.value) }
    //             < /button>
    //   );
};

export default OpenFile;
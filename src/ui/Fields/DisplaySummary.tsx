import { IconButton, Typography, makeStyles } from '@material-ui/core';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import React from 'react';
import { Display } from '../../Setup/Application/Display';

interface DisplaySummaryProps {
    display: Display;
    setOpen: (open: boolean) => void;
    open: boolean;
    buttonSize?: 'inherit' | 'default' | 'small' | 'large';
}

const useStyles = makeStyles((/*theme: Theme*/) => ({
    root: {
        display: 'flex',
        alignItems: 'center',
    },
    button: {
        flexGrow: 0,
    },
    label: {
        flexGrow: 1,
    }
}));


const DisplaySummary = ({ display, setOpen, open, buttonSize }: DisplaySummaryProps): JSX.Element => {
    const plugins = display.browsers
        .map(browser => browser?.plugins.size ?? 0)
        .reduce((result, size) => result + size, 0);

    const classes = useStyles();

    return (
        <div className={classes.root}>
            <IconButton className={classes.button} aria-label="expand row" size="small" onClick={(): void => setOpen(!open)}>
                {open ? <ExpandLess fontSize={buttonSize ?? 'default'} /> : <ExpandMore fontSize={buttonSize ?? 'default'} />}
            </IconButton>
            <Typography className={classes.label} color="textSecondary">
                {display.browsers.size + ' browser' + (display.browsers.size > 1 ? 's' : '') + ', ' + plugins + ' plugin' + (plugins > 1 ? 's' : '')}
            </Typography>
        </div>
    );
};

export default DisplaySummary;

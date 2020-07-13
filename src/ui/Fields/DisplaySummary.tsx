import { IconButton, Typography, makeStyles } from '@material-ui/core';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import React from 'react';
import { Display } from '../../Setup/Application/Display';

interface DisplaySummaryProps {
    display: Display;
    setOpen: (open: boolean) => void;
    open: boolean;
}

const useStyles = makeStyles((/*theme: Theme*/) => ({
    root: {
        display: 'flex',
    },
    button: {
        flexGrow: 0,
    },
    label: {
        flexGrow: 1,
    }
}));


const DisplaySummary = ({ display, setOpen, open }: DisplaySummaryProps): JSX.Element => {
    const plugins = display.browsers
        .map(browser => browser?.plugins.size ?? 0)
        .reduce((result, size) => result + size);

    const classes = useStyles();

    return (
        <div className={classes.root}>
            <IconButton className={classes.button} aria-label="expand row" size="small" onClick={(): void => setOpen(!open)}>
                {open ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
            <Typography className={classes.label} color="textSecondary">
                {display.browsers.size + ' browser' + (display.browsers.size > 1 ? 's' : '') + ', ' + plugins + ' plugin' + (plugins > 1 ? 's' : '')}
            </Typography>
        </div>
    );
};

export default DisplaySummary;

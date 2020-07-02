import { makeStyles, TextField, Typography, withStyles } from '@material-ui/core';
import { TreeItem } from '@material-ui/lab';
import { observer } from 'mobx-react-lite';
import React, { ChangeEvent } from 'react';
import { Browser } from '../../../Setup/Application/Browser';
import dashboardStyle from '../../assets/jss/material-dashboard-react/views/dashboardStyle';
import RelativeRectangle from '../../Fields/RelativeRectangle';
import BrowserPlugins from './BrowserPlugins';

interface Props {
    browser: Browser;
}

const useStyles = makeStyles((/*theme*/) =>
    dashboardStyle
);

const Label = observer(({ browser }: Props): JSX.Element => {
    const classes = useStyles();
    const cpuUsage = (browser.cpuUsage ?? 0) * 100;

    return (
        <div className={classes.browserLabel}>
            <TextField
                className={classes.browserName}
                value={browser.name}
                onChange={(e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): string => browser.name = e.target.value }
            />
            <RelativeRectangle rect={browser.relative} />
            {(cpuUsage == undefined) ? (<></>) :
                (cpuUsage < 5) ? <Typography className={classes.successText}> - {cpuUsage.toFixed(1)} %cpu</Typography> :
                    (cpuUsage < 10) ? <Typography className={classes.warningText}> - {cpuUsage.toFixed(0)} %CPU</Typography> :
                        <Typography className={classes.dangerText}> - {cpuUsage.toFixed(0)} %CPU</Typography>}
        </div>
    );
});

const BrowserLine = observer(({ browser }: Props): JSX.Element => {

    return (
        <TreeItem
            nodeId={browser.id}
            label={<Label browser={browser} />}
        >
            <BrowserPlugins browser={browser} />
        </TreeItem>
    );
});

export default withStyles(dashboardStyle)(BrowserLine);
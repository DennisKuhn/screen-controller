import { makeStyles, TextField, Typography, withStyles } from '@material-ui/core';
import { TreeItem } from '@material-ui/lab';
import { observer } from 'mobx-react-lite';
import React, { ChangeEvent } from 'react';
import { Browser } from '../../../Setup/Application/Browser';
import dashboardStyle from '../../assets/jss/material-dashboard-react/views/dashboardStyle';
import RelativeRectangle from '../../Fields/RelativeRectangle';
import BrowserPlugins from './BrowserPlugins';
import { getCpuUsage, getCpuText, getCpuClass } from './Tools';

interface Props {
    browser: Browser;
}

const useStyles = makeStyles((/*theme*/) =>
    dashboardStyle
);

const Label = observer(({ browser }: Props): JSX.Element => {
    const classes = useStyles();
    const cpuUsage = getCpuUsage(browser.cpuUsage);
    const cpuText = getCpuText( cpuUsage );
    const cpuClass = classes[getCpuClass(cpuUsage)];

    return (
        <div className={classes.browserLabel}>
            <Typography className={cpuClass}>{cpuText}</Typography>
            <TextField
                className={classes.browserName}
                value={browser.name}
                onChange={(e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): string => browser.name = e.target.value }
            />
            <RelativeRectangle rect={browser.relative} />
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
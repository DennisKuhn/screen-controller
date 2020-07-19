import { IconButton, makeStyles, TableCell, TableRow, TextField, Typography } from '@material-ui/core';
import { PausePresentation, Slideshow, Visibility, VisibilityOff, Alarm } from '@material-ui/icons';
import { observer } from 'mobx-react-lite';
import React, { ChangeEvent } from 'react';
import { Plugin } from '../../../Setup/Application/Plugin';
import dashboardStyle from '../../assets/jss/material-dashboard-react/views/dashboardStyle';
import RectangleEditor from '../../Fields/RectangleEditor';
import { getCpuClass, getCpuText, getCpuUsage } from './Tools';

interface Props {
    plugin: Plugin;
}

const useStyles = makeStyles((/*theme*/) =>
    dashboardStyle
);

const Performance = observer(({ plugin }: Props): JSX.Element => {
    const classes = useStyles();
    const cpuUsage = getCpuUsage(plugin.performance.timePerSecond);
    const cpuText = getCpuText(cpuUsage);
    const cpuClass = classes[getCpuClass(cpuUsage)];

    return (
        <>
            <TableCell>
                <Typography className={cpuClass}>{cpuText}</Typography>
            </TableCell>
            <TableCell>
                <Typography>
                    {(plugin.performance.ticksPerSecond ?? 0).toFixed(1)}
                </Typography>
            </TableCell>
            <TableCell>
                {plugin.performance.failing === true && <Alarm />}
                <Typography>
                    {plugin.performance.failsPerSecond}
                </Typography>
            </TableCell>
        </>
    );
});

const Actions = observer(({ plugin }: Props): JSX.Element => {
    return (
        <TableCell>
            <IconButton>
                {true ? <Slideshow /> : <PausePresentation />}
            </IconButton>
            <IconButton>
                {true ? <Visibility /> : <VisibilityOff />}
            </IconButton>
        </TableCell>
    );
});

const PluginLine = observer(({ plugin }: Props): JSX.Element => {
    const classes = useStyles();

    return (<TableRow>
        <Performance plugin={plugin} />
        <TableCell>
            <TextField
                className={classes.browserName}
                value={plugin.name}
                onChange={(e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): string => plugin.name = e.target.value}
            />
        </TableCell>
        <Actions plugin={plugin} />
        <TableCell>
            <RectangleEditor value={plugin.relativeBounds} />
        </TableCell>
    </TableRow>);
});

export default PluginLine;
import { IconButton, makeStyles, TableCell, TableRow, TextField, Typography } from '@material-ui/core';
import { PausePresentation, Slideshow, Visibility, VisibilityOff } from '@material-ui/icons';
import { observer } from 'mobx-react-lite';
import React, { ChangeEvent } from 'react';
import { Plugin } from '../../../Setup/Application/Plugin';
import dashboardStyle from '../../assets/jss/material-dashboard-react/views/dashboardStyle';
import RectangleCells from './RectangleCells';
import { getCpuClass, getCpuText, getCpuUsage } from './Tools';

interface Props {
    plugin: Plugin;
}

const useStyles = makeStyles((/*theme*/) =>
    dashboardStyle
);

const Performance = observer(({ plugin }: Props): JSX.Element => {
    const classes = useStyles();
    const cpuUsage = getCpuUsage(plugin.cpuUsage);
    const cpuText = getCpuText(cpuUsage);
    const cpuClass = classes[getCpuClass(cpuUsage)];

    return (
        <>
            <TableCell>
                <Typography className={cpuClass}>{cpuText}</Typography>
            </TableCell>
            <TableCell>
                <Typography>
                    {(plugin.fps ?? 0).toFixed(1)}
                </Typography>
            </TableCell>
            <TableCell>
                <Typography>
                    {plugin.skipped}
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
        <RectangleCells rect={plugin.relativeBounds} />
    </TableRow>);
});

export default PluginLine;
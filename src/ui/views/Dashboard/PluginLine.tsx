import { makeStyles, TextField, Typography, TableRow, TableCell } from '@material-ui/core';
import { observer } from 'mobx-react-lite';
import React, { ChangeEvent } from 'react';
import { Plugin } from '../../../Setup/Application/Plugin';
import dashboardStyle from '../../assets/jss/material-dashboard-react/views/dashboardStyle';
import { getCpuClass, getCpuText, getCpuUsage } from './Tools';
import RectangleCells from './RectangleCells';

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
        <RectangleCells rect={plugin.relativeBounds} />
    </TableRow>);
});

export default PluginLine;
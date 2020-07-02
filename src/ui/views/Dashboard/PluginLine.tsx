import { makeStyles, TextField, Typography } from '@material-ui/core';
import { observer } from 'mobx-react-lite';
import React, { ChangeEvent } from 'react';
import { Plugin } from '../../../Setup/Application/Plugin';
import dashboardStyle from '../../assets/jss/material-dashboard-react/views/dashboardStyle';
import GridContainer from '../../components/Grid/GridContainer';
import GridItem from '../../components/Grid/GridItem';
import RelativeRectangle from '../../Fields/RelativeRectangle';
import { getCpuClass, getCpuText, getCpuUsage } from './Tools';

interface Props {
    plugin: Plugin;
}

const useStyles = makeStyles((/*theme*/) =>
    dashboardStyle
);


const PluginLine = observer(({ plugin }: Props): JSX.Element => {
    const classes = useStyles();
    const cpuUsage = getCpuUsage(plugin.cpuUsage);
    const cpuText = getCpuText(cpuUsage);
    const cpuClass = classes[getCpuClass(cpuUsage)];
    
    return (<GridContainer item>
        <GridItem>
            <Typography className={cpuClass}>{cpuText}</Typography>
        </GridItem>
        <GridItem>
            <Typography>
                {(plugin.fps ?? 0).toFixed(1)}
            </Typography>
        </GridItem>
        <GridItem>
            <Typography>
                {plugin.skipped}
            </Typography>
        </GridItem>
        <GridItem>
            <TextField
                className={classes.browserName}
                value={plugin.name}
                onChange={(e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): string => plugin.name = e.target.value}
            />
        </GridItem>
        <GridItem>
            <RelativeRectangle rect={plugin.relativeBounds} />
        </GridItem>
    </GridContainer>);
});

export default PluginLine;
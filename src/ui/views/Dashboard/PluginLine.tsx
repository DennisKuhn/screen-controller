import { Plugin } from '../../../Setup/Application/Plugin';
import { observer } from 'mobx-react-lite';
import React from 'react';
import dashboardStyle from '../../assets/jss/material-dashboard-react/views/dashboardStyle';
import { makeStyles, Grid, Typography } from '@material-ui/core';

interface Props {
    plugin: Plugin;
}

const useStyles = makeStyles((/*theme*/) =>
    dashboardStyle
);


const PluginLine = observer(({ plugin }: Props): JSX.Element => {
    const classes = useStyles();
    const cpuUsage = (plugin.cpuUsage ?? 0) * 100;
    
    return (<Grid container item>
        <Grid item>
            {
                (cpuUsage < 5) ? <Typography className={classes.successText}>{cpuUsage.toFixed(1)}</Typography> :
                    (cpuUsage < 10) ? <Typography className={classes.warningText}>{cpuUsage.toFixed(0)}</Typography> :
                        <Typography className={classes.dangerText}>{cpuUsage.toFixed(0)}</Typography>}
        </Grid>
        <Grid item>
            <Typography>
                {(plugin.fps ?? 0).toFixed(1)}
            </Typography>
        </Grid>
        <Grid item>
            <Typography>
                {plugin.continuesSkipped}
            </Typography>
        </Grid>
        <Grid item>
            <Typography>
                {plugin.name}
            </Typography>
        </Grid>

    </Grid>);
});

export default PluginLine;
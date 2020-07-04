import { Fragment } from 'react';
import { observer } from 'mobx-react-lite';
import { getCpuUsage, getCpuText, getCpuClass } from './Tools';
import React from 'react';
import { TableCell, Typography, makeStyles } from '@material-ui/core';
import { Browser } from '../../../Setup/Application/Browser';
import dashboardStyle from '../../assets/jss/material-dashboard-react/views/dashboardStyle';

const useStyles = makeStyles((/*theme*/) =>
    dashboardStyle
);

interface Props {
    browser: Browser;
    addFiller: boolean;
}

const BrowserPerformanceCells = observer(({ browser, addFiller }: Props): JSX.Element => {
    const usages = browser.plugins.map(plugin => plugin?.cpuUsage);
    const pluginsUsage = usages && usages.length > 0 ?
        usages.reduce((total, usage) =>
            usage === undefined ? undefined : (total ?? 0) + usage
        ) : undefined;

    const classes = useStyles();
    const cpuUsage = getCpuUsage(browser.cpuUsage);
    const cpuText = getCpuText(cpuUsage);
    const cpuClass = classes[getCpuClass(cpuUsage)];

    if ((pluginsUsage === undefined) || (browser.cpuUsage == undefined)) {
        return (
            <Fragment>
                <TableCell>
                    <Typography className={cpuClass}>{cpuText}</Typography>
                </TableCell>
                {addFiller && <TableCell colSpan={2} />}
            </Fragment>
        );
    }
    const pluginsCpuUsage = getCpuUsage(pluginsUsage / browser.cpuUsage);
    const pluginsCpuText = getCpuText(pluginsCpuUsage);
    // const pluginsCpuClass = classes[getCpuClass(pluginsCpuUsage)];

    const otherCpuUsage = getCpuUsage((browser.cpuUsage - pluginsUsage) / browser.cpuUsage);
    const otherCpuText = getCpuText(otherCpuUsage);
    // const otherCpuClass = classes.;


    return (
        <Fragment>
            <TableCell>
                <Typography className={cpuClass}>{cpuText}</Typography>
            </TableCell>
            <TableCell>
                <Typography >{pluginsCpuText}</Typography>
            </TableCell>
            <TableCell>
                <Typography >{otherCpuText}</Typography>
            </TableCell>
        </Fragment>
    );
});

export default BrowserPerformanceCells;
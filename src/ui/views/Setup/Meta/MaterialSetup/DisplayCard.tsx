import { Box, Collapse, makeStyles } from '@material-ui/core';
import { DesktopWindows } from '@material-ui/icons';
import { remote } from 'electron';
import React, { useState } from 'react';
import { Display } from '../../../../../Setup/Application/Display';
import { callerAndfName } from '../../../../../utils/debugging';
import dashboardStyle from '../../../../assets/jss/material-dashboard-react/views/dashboardStyle';
import Card from '../../../../components/Card/Card';
import CardBody from '../../../../components/Card/CardBody';
import CardFooter from '../../../../components/Card/CardFooter';
import CardHeader from '../../../../components/Card/CardHeader';
import CardIcon from '../../../../components/Card/CardIcon';
import DisplaySummary from '../../../../Fields/DisplaySummary';
import { ObjectPropsWithChildren } from '../../Shared';

const electronDisplays = new Map<string, Electron.Display>();

remote.screen.getAllDisplays().forEach(info => electronDisplays.set(info.id.toFixed(), info));

const useCardStyles = makeStyles((/*theme*/) =>
    dashboardStyle
);


const DisplayCard = (props: ObjectPropsWithChildren): JSX.Element => {
    if (!(props.item instanceof Display)) throw new Error(`${callerAndfName()} props.item is not instaceof Display`);
    const [open, setOpen] = useState(false);

    const display = props.item;
    const classes = useCardStyles();

    const cpuUsage = (display.browsers
        .map(browser => browser?.cpuUsage ?? 0)
        .reduce((result, usage) => result + usage) * 100);

    const info = electronDisplays.get(display.id);
    if (!info) throw new Error(`${callerAndfName()} can't get electron display info for ${display.id}`);

    return (
        <Card>
            <CardHeader color={(cpuUsage < 5) ? 'success' : (cpuUsage < 10) ? 'warning' : 'danger'} stats={true} icon={true}>
                <CardIcon color={(cpuUsage < 5) ? 'success' : (cpuUsage < 10) ? 'warning' : 'danger'}>
                    <DesktopWindows transform={`rotate(${info.rotation})`} />
                </CardIcon>
                <p className={classes.cardCategory}>Display</p>
                <h4 className={classes.cardTitle}>{display.name}</h4>
            </CardHeader>
            <CardBody>
                <DisplaySummary
                    display={display}
                    open={open}
                    setOpen={setOpen}
                    buttonSize="small"
                />
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box margin={1}>
                        {props.children}
                    </Box>
                </Collapse>
            </CardBody>
            <CardFooter stats={true} className={classes.displayFooter}>
                <span className={(cpuUsage < 5) ? classes.displayFooterCpuGood : (cpuUsage < 10) ? classes.displayFooterCpuDanger : classes.displayFooterCpuDanger}>
                    {cpuUsage.toFixed(cpuUsage < 10 ? 1 : 0) + ' %CPU'}
                </span>
                <span className={classes.displayFooterResolution}>
                    {info.scaleFactor == 1 ?
                        (`${info.size.width}*${info.size.height}`) :
                        (`${info.size.width}*${info.size.height}, ${info.scaleFactor * 100}% [${info.size.width * info.scaleFactor}*${info.size.height * info.scaleFactor}]`)
                    }
                </span>
            </CardFooter>
        </Card>
    );
};

export default DisplayCard;
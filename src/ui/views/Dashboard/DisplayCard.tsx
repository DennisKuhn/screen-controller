import {
    Box,
    Collapse,
    IconButton,
    makeStyles,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography
} from '@material-ui/core';
import { DesktopWindows, ExpandLess, ExpandMore } from '@material-ui/icons';
import { Display as Info } from 'electron';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Browser } from '../../../Setup/Application/Browser';
import { Display } from '../../../Setup/Application/Display';
import dashboardStyle from '../../assets/jss/material-dashboard-react/views/dashboardStyle';
import Card from '../../components/Card/Card';
import CardBody from '../../components/Card/CardBody';
import CardFooter from '../../components/Card/CardFooter';
import CardHeader from '../../components/Card/CardHeader';
import CardIcon from '../../components/Card/CardIcon';
import GridContainer from '../../components/Grid/GridContainer';
import GridItem from '../../components/Grid/GridItem';
import BrowserLine from './BrowserLine';

interface Props {
    display: Display;
    info: Info;
}

const useCardStyles = makeStyles((/*theme*/) =>
    dashboardStyle
);

const DisplayCard = observer((props: Props): JSX.Element => {
    const { display, info } = props;
    const classes = useCardStyles();

    const [open, setOpen] = useState(false);

    const cpuUsage = (display.browsers
        .map(browser => browser?.cpuUsage ?? 0)
        .reduce((result, usage) => result + usage) * 100);

    const plugins = display.browsers
        .map(browser => browser?.plugins.size ?? 0)
        .reduce((result, size) => result + size);

    const loadedPlugins = plugins > 0 && display.browsers
        .map(browser => browser?.plugins)
        .reduce(
            (loaded, plugins) =>
                loaded || plugins !== undefined && plugins
                    .map(candidate => candidate != null)
                    .some(isLoaded => isLoaded),
            false
        );

    return (
        <GridItem xs={12} sm={open ? 12 : 6} md={open ? 12 : 6} lg={open ? 8 : 4} xl={open ? 6 : 2}>
            <Card>
                <CardHeader color={(cpuUsage < 5) ? 'success' : (cpuUsage < 10) ? 'warning' : 'danger'} stats={true} icon={true}>
                    <CardIcon color={(cpuUsage < 5) ? 'success' : (cpuUsage < 10) ? 'warning' : 'danger'}>
                        <DesktopWindows transform={`rotate(${info.rotation})`} />
                    </CardIcon>
                    <p className={classes.cardCategory}>Display</p>
                    <h3 className={classes.cardTitle}>{display.name}</h3>
                </CardHeader>
                <CardBody>
                    <GridContainer>
                        <GridItem>
                            <IconButton aria-label="expand row" size="small" onClick={(): void => setOpen(!open)}>
                                {open ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                        </GridItem>
                        <GridItem>
                            <Typography>
                                {display.browsers.size + ' browser' + (display.browsers.size > 1 ? 's' : '') + ', ' + plugins + ' plugin' + (plugins > 1 ? 's' : '')}
                            </Typography>
                        </GridItem>
                    </GridContainer>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box margin={1}>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell />
                                            <TableCell>CPU [%]</TableCell>
                                            {loadedPlugins && <TableCell colSpan={2} />}
                                            <TableCell>Name</TableCell>
                                            <TableCell></TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {display.browsers.map(browser => browser ?
                                            <BrowserLine key={browser.id} browser={browser as Browser} addPerformanceFiller={loadedPlugins} />
                                            : (<div>no browser</div>))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
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
        </GridItem>
    );
});

export default DisplayCard;

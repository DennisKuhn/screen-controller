import { makeStyles } from '@material-ui/core';
import { DesktopWindows, ExpandLess, ExpandMore } from '@material-ui/icons';
import { Display as Info } from 'electron';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Display } from '../../../Setup/Application/Display';
import dashboardStyle from '../../assets/jss/material-dashboard-react/views/dashboardStyle';
import Card from '../../components/Card/Card';
import CardBody from '../../components/Card/CardBody';
import CardFooter from '../../components/Card/CardFooter';
import CardHeader from '../../components/Card/CardHeader';
import CardIcon from '../../components/Card/CardIcon';
import GridItem from '../../components/Grid/GridItem';
import BrowserLine from './BrowserLine';
import { Browser } from '../../../Setup/Application/Browser';
import { TreeItem, TreeView } from '@material-ui/lab';

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

    const [expanded, setExpanded] = useState(false);

    const cpuUsage = (display.browsers
        .map(browser => browser?.cpuUsage ?? 0)
        .reduce((result, usage) => result + usage) * 100);

    const plugins = display.browsers
        .map(browser => browser?.plugins.size ?? 0)
        .reduce((result, size) => result + size);
    
    const rootNodeId = display.id + '.Browsers';

    return (
        <GridItem xs={12} sm={expanded ? 12 : 6} md={expanded ? 10 : 4} lg={expanded ? 8 : 3} xl={expanded ? 6 : 2}>
            <Card>
                <CardHeader color={(cpuUsage < 5) ? 'success' : (cpuUsage < 10) ? 'warning' : 'danger'} stats={true} icon={true}>
                    <CardIcon color={(cpuUsage < 5) ? 'success' : (cpuUsage < 10) ? 'warning' : 'danger'}>
                        <DesktopWindows transform={`rotate(${info.rotation})`} />
                    </CardIcon>
                    <p className={classes.cardCategory}>Display</p>
                    <h3 className={classes.cardTitle}>{display.name}</h3>
                </CardHeader>
                <CardBody>
                    <div className={classes.cardBody}>
                        <TreeView
                            defaultCollapseIcon={<ExpandLess />}
                            defaultExpandIcon={<ExpandMore />}
                            selected={''}
                            onNodeToggle={(e, nodeIds: string[]): void => {
                                const newExpanded = nodeIds.includes(rootNodeId);
                                newExpanded != expanded && setExpanded(newExpanded);
                            }}
                        // defaultExpanded={expand ? [root.id] : []}
                        >
                            <TreeItem
                                nodeId={rootNodeId}
                                label={display.browsers.size + ' browser' + (display.browsers.size > 1 ? 's' : '') + ', ' + plugins + ' plugin' + (plugins > 1 ? 's' : '')}
                            >
                                {display.browsers.map(browser => browser ? <BrowserLine key={browser.id} browser={browser as Browser} /> : (<div>no browser</div>))}
                            </TreeItem>
                        </TreeView>
                    </div>
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

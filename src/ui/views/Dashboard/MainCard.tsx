import {
    makeStyles,
    Typography
} from '@material-ui/core';
import { SettingsApplications } from '@material-ui/icons';
import { observer } from 'mobx-react-lite';
import React, { useState, useEffect } from 'react';
import { Root } from '../../../Setup/Application/Root';
import dashboardStyle from '../../assets/jss/material-dashboard-react/views/dashboardStyle';
import Card from '../../components/Card/Card';
import CardBody from '../../components/Card/CardBody';
import CardFooter from '../../components/Card/CardFooter';
import CardHeader from '../../components/Card/CardHeader';
import CardIcon from '../../components/Card/CardIcon';
import GridItem from '../../components/Grid/GridItem';
import controller from '../../../Setup/Controller/Factory';
import { getCpuUsage, getCpuText, getCpuClass } from './Tools';

interface Props {
    root: Root;
}

const useCardStyles = makeStyles((/*theme*/) =>
    dashboardStyle
);

const MainCard = observer((props: Props): JSX.Element => {
    const { root } = props;
    const classes = useCardStyles();

    const cpuUsage = getCpuUsage(root.mainCpuUsage);
    const cpuText = getCpuText(cpuUsage);
    const cpuClass = classes[getCpuClass(cpuUsage)];

    return (
        <GridItem xs={12} sm={6} md={6} lg={4} xl={2}>
            <Card>
                <CardHeader color={(cpuUsage < 5) ? 'success' : (cpuUsage < 10) ? 'warning' : 'danger'} stats={true} icon={true}>
                    <CardIcon color={(cpuUsage < 5) ? 'success' : (cpuUsage < 10) ? 'warning' : 'danger'}>
                        <SettingsApplications />
                    </CardIcon>
                    <p className={classes.cardCategory}>Process</p>
                    <h3 className={classes.cardTitle}>Main</h3>
                </CardHeader>
                <CardBody>
                    
                </CardBody>
                <CardFooter stats={true} className={classes.stats}>
                    <span className={cpuClass}>{cpuText} % CPU</span>
                </CardFooter>
            </Card>
        </GridItem>
    );
});

const RootGetter = (): JSX.Element => {
    const [root, setRoot] = useState(undefined as Root | undefined);

    const getRoot = (): void => {
        // get Root.
        (controller.getSetup(Root.name, 0) as Promise<Root>)
            .then(setRoot);
    };

    useEffect(getRoot, []);

    return root ? <MainCard root={root} /> : (<></>);
};


export default RootGetter;

import React, { useState, useEffect } from 'react';

// @material-ui/core
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';

// @material-ui/icons
import Computer from '@material-ui/icons/Computer';
import LibraryAdd from '@material-ui/icons/LibraryAdd';

import GridItem from '../../components/Grid/GridItem';
import GridContainer from '../../components/Grid/GridContainer';
import Card from '../../components/Card/Card';
import CardHeader from '../../components/Card/CardHeader';
import CardIcon from '../../components/Card/CardIcon';
import CardBody from '../../components/Card/CardBody';
import CardFooter from '../../components/Card/CardFooter';

import { Screen } from '../../../Setup/Application/Screen';
import { Display } from '../../../Setup/Application/Display';
import { remote } from 'electron';
import Browsers from './Browsers';
import controller from '../../../Setup/Controller';
import { observer } from 'mobx-react-lite';
import { ObservableSetupBaseMap } from '../../../Setup/Container';

const DisplayCard = observer(({ config, specs }: { config: Display; specs: Electron.Display }): JSX.Element => {

    //xs, sm, md, lg, and xl
    return <GridItem xs={12} sm={12} md={12} lg={8} xl={6}>
        <Card>
            <CardHeader color="success" stats={true} icon={true}>
                <CardIcon color="success">
                    <Computer />
                </CardIcon>
                <Tooltip
                    id="tooltip-top"
                    title="Add wallpaper"
                    placement="top"
                >
                    <IconButton
                        aria-label="Edit"
                        onClick={config.addBrowser}
                    >
                        <LibraryAdd />
                    </IconButton>
                </Tooltip>
            </CardHeader>
            <CardBody>
                <Browsers browsers={config.browsers} />
            </CardBody>
            <CardFooter stats={true}>
                <p>{config.id} - {specs.scaleFactor}* {specs.workArea.width} x {specs.workArea.height}</p>
            </CardFooter>
        </Card>
    </GridItem>;
});

const DisplayContainer = observer(({ displays }: { displays: ObservableSetupBaseMap<Display> }): JSX.Element => {
    // console.log(`Displays.tsx: DisplayContainer ready=${remote.app.isReady()}`);

    const electronDisplays = remote.screen.getAllDisplays().reduce((result, display) => {
        result[display.id] = display;
        return result;
    }, {});

    return <GridContainer>
        {
            displays.map(display => display)
                .filter(display => display != null)
                .map(display => display as Display)
                .map(display =>
                    <DisplayCard
                        key={display.id}
                        config={display}
                        specs={electronDisplays[display.id]} />
            )
        }
    </GridContainer>;
});


// export default function DisplaysPage(): JSX.Element {
const DisplaysPage = (): JSX.Element => {
    const [displays, setDisplays] = useState(new ObservableSetupBaseMap<Display>());

    useEffect(() => {
        console.log('Fire use effect');
        controller.getSetup('Screen', -1)
            .then(screen => setDisplays((screen as Screen).displays));
    }, []);

    return <DisplayContainer displays={displays} />;
};

export default DisplaysPage;

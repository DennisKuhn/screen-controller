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

import { Screen, Display, Browser, DisplayMap } from '../../../infrastructure/Configuration/WallpaperSetup';
import { remote } from 'electron';
import Browsers from './Browsers';
import controller from '../../../infrastructure/Configuration/Controller';
import { observer } from 'mobx-react-lite';

const DisplayCard = observer(({ config, specs }: { config: Display; specs: Electron.Display }): JSX.Element => {

    function addPaper(): void {
        const newBrowser = Browser.createNew(config.id, {
            x: 0,
            y: 0,
            height: 1,
            width: 1
        });
        config.children.set(
            newBrowser.id,
            newBrowser
        );
    }
    //xs, sm, md, lg, and xl
    return <GridItem xs={12} sm={8} md={6} lg={4} xl={3}>
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
                        onClick={addPaper}
                    >
                        <LibraryAdd />
                    </IconButton>
                </Tooltip>
            </CardHeader>
            <CardBody>
                <Browsers browsers={config.children} />
            </CardBody>
            <CardFooter stats={true}>
                <p>{config.id} - {specs.scaleFactor}* {specs.workArea.width} x {specs.workArea.height}</p>
            </CardFooter>
        </Card>
    </GridItem>;
});

const DisplayContainer = observer(({ displays }: { displays: DisplayMap }): JSX.Element => {
    console.log(`Displays.tsx: Electron is ready=${remote.app.isReady()}`);

    const electronDisplays = remote.screen.getAllDisplays().reduce((result, display) => {
        result[display.id] = display;
        return result;
    }, {});

    return <GridContainer>
        {
            displays.map(display => display).filter(display => display != undefined).map((display) => display as Display).map(
                display => <DisplayCard key={display.id} config={display} specs={electronDisplays[display.id]} />
            )
        }
    </GridContainer>;
});


// export default function DisplaysPage(): JSX.Element {
const DisplaysPage = observer((): JSX.Element => {
    const [displays, setDisplays] = useState(new DisplayMap());

    useEffect(() => {
        controller.getSetup('Screen', 2)
            .then(screen => setDisplays((screen as Screen).children));
    }, []);

    return <DisplayContainer displays={displays} />;
});

export default DisplaysPage;

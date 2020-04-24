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

import configController from '../../../infrastructure/Configuration/Controller';
import { Setup, Display, DisplayIterableDictionary, SetupDiff, Browser } from '../../../infrastructure/Configuration/WallpaperSetup';
import { remote } from 'electron';
import Browsers from './Browsers';
import controller from '../../../infrastructure/Configuration/Controller';

function DisplayCard({ config, specs }: { config: Display; specs: Electron.Display }): JSX.Element {

    function addPaper(): void {
        controller.getSetup(false).then(
            setup => {
                let newBrowserId = 0;
                const ids = setup.displays.values.flatMap(
                    display => display.browsers.keys
                );
                while (ids.indexOf(newBrowserId) >= 0) {
                    newBrowserId += 1;
                }
                console.log(`DisplayCard[${config.id}].addPaper: id=${newBrowserId}`);
                config.browsers[newBrowserId] = new Browser({
                    id: newBrowserId,
                    rx: 0,
                    ry: 0,
                    rHeight: 1,
                    rWidth: 1
                });
            }
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
                <Browsers browsers={config.browsers} />
            </CardBody>
            <CardFooter stats={true}>
                <p>{config.id} - {specs.scaleFactor}* {specs.workArea.width} x {specs.workArea.height}</p>
            </CardFooter>
        </Card>
    </GridItem>;
}

function DisplayContainer({ displays }: { displays: DisplayIterableDictionary }): JSX.Element {
    console.log(`Displays.tsx: Electron is ready=${remote.app.isReady()}`);

    const electronDisplays = remote.screen.getAllDisplays().reduce((result, display) => {
        result[display.id] = display;
        return result;
    }, {});
    return <GridContainer>
        {
            displays.values.map(
                display => <DisplayCard key={display.id} config={display} specs={electronDisplays[display.id]} />
            )
        }
    </GridContainer>;
}


// export default function DisplaysPage(): JSX.Element {
export default function DisplaysPage(): JSX.Element {
    const [setup, setSetup] = useState(new Setup());

    useEffect(() => {
        configController.getSetup(false)
            .then(setup => setSetup(setup));
    }, []);

    return <DisplayContainer displays={setup.displays} />;
}

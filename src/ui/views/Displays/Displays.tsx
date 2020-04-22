import React, { useState, useEffect } from 'react';

// @material-ui/core
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';

// @material-ui/icons
import DesktopWindows from '@material-ui/icons/DesktopWindows';
import LibraryAdd from '@material-ui/icons/LibraryAdd';


import GridItem from '../../components/Grid/GridItem';
import GridContainer from '../../components/Grid/GridContainer';
import Card from '../../components/Card/Card';
import CardHeader from '../../components/Card/CardHeader';
import CardIcon from '../../components/Card/CardIcon';
import CardBody from '../../components/Card/CardBody';
import CardFooter from '../../components/Card/CardFooter';

import configController from '../../../infrastructure/Configuration/Controller';
import { Setup, Display, IterableNumberDictionary, SetupDiff } from '../../../infrastructure/Configuration/WallpaperSetup';
import { remote } from 'electron';

function DisplayCard({ config, specs }: { config: Display; specs: Electron.Display }): JSX.Element {

    function addPaper(): void {
        // const addition = new SetupDiff();
        // const displayDiff = new DisplayDiff(config.id);
        // addition.displays[config.id] = displayDiff;
        // displayDiff.browsers[0] = {
        //     id: 0,
        //     rx: 0,
        //     ry: 0,
        //     rHeight: 0,
        //     rWidth: 0
        // };
        const update = new SetupDiff( {
            displays: {
                [config.id]: {
                    id: config.id,
                    browsers: {
                        [0]: {
                            id: 0,
                            rx: 0,
                            ry: 0,
                            rHeight: 0,
                            rWidth: 0
                        }
                    }
                }
            }
        } );
        configController.updateSetup(update);
    }

    return <GridItem xs={12} sm={6} md={3}>
        <Card>
            <CardHeader color="success" stats={true} icon={true}>
                <CardIcon color="success">
                    <DesktopWindows />
                </CardIcon>
                <p>{config.id}</p>
            </CardHeader>
            <CardBody>
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
            </CardBody>
            <CardFooter stats={true}>
                <p>{specs.workArea.width} x {specs.workArea.height}</p>
            </CardFooter>
        </Card>
    </GridItem>;
}

function DisplayContainer({ displays }: { displays: IterableNumberDictionary<Display> }): JSX.Element {
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

import React, { useState, useEffect } from 'react';
import { Root } from '../../../Setup/Application/Root';
import { Screen } from '../../../Setup/Application/Screen';
import controller from '../../../Setup/Controller/Factory';
import Form from './RootForm';

import './Meta/Structure';
//import './Meta/Html';
//import './Meta/HtmlCompact';
//import './Meta/Material';
//import './Meta/MaterialCompact';
import './Meta/MaterialScreen';
import GridContainer from '../../components/Grid/GridContainer';
import GridItem from '../../components/Grid/GridContainer';

// import './Meta/Html'; //TODO multiple imports -> no error
// import './Meta/Html5'; //TODO spelling mistake -> no error

const SetupScreen = (): JSX.Element => {
    const [screen, setScreen] = useState(undefined as Screen | undefined);

    useEffect(
        () => {
            controller.getSetup(Screen.name, 0)
                .then(screen =>
                    setScreen(screen as Screen));
        },
        []
    );

    return (
        <GridContainer>
            <GridItem>
                <Form value={Root.name} />
            </GridItem>
            <GridItem>
                <Form value={Screen.name} />
            </GridItem>
            {screen && screen.displays.mapKeys(displayId =>
                <GridItem><Form value={displayId} /></GridItem>
            )}
        </GridContainer>
    );
};

export default SetupScreen;

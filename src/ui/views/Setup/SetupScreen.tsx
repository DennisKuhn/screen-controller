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
// import GridContainer from '../../components/Grid/GridContainer';
// import GridItem from '../../components/Grid/GridContainer';
import { makeStyles, Grid, Theme } from '@material-ui/core';

// import './Meta/Html'; //TODO multiple imports -> no error
// import './Meta/Html5'; //TODO spelling mistake -> no error
const useStyles = makeStyles((theme: Theme) => ({
    container: {

    },
    item: {
        padding: theme.spacing(2),
    },
}));

const SetupScreen = (): JSX.Element => {
    const [screen, setScreen] = useState(undefined as Screen | undefined);
    const classes = useStyles();

    useEffect(
        () => {
            controller.getSetup(Screen.name, 0)
                .then(screen =>
                    setScreen(screen as Screen));
        },
        []
    );

    return (
        <Grid container className={classes.container}>
            <Grid item className={classes.item}>
                <Form value={Root.name} />
            </Grid>
            <Grid item className={classes.item}>
                <Form value={Screen.name} />
            </Grid>
            {screen && screen.displays.mapKeys(displayId =>
                <Grid item className={classes.item}>
                    <Form value={displayId} />
                </Grid>
            )}
        </Grid>
    );
};

export default SetupScreen;

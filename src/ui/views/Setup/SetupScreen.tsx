import React, { Fragment, useState, useEffect } from 'react';
import GridContainer from '../../components/Grid/GridContainer';

import Form from './Form';
import { Typography } from '@material-ui/core';
import { Root } from '../../../Setup/Application/Root';
import controller from '../../../Setup/Controller/Factory';
import { SetupBase } from '../../../Setup/SetupBase';



const render = (): JSX.Element => {
    const [root, setRoot] = useState(undefined as SetupBase | undefined);

    useEffect(() => {
        controller.getSetup(Root.name, 0)
            .then(setRoot);
    }, []);

    return root ? <Form setup={root} /> : <Typography>Loading ...</Typography>;
};

export default render;

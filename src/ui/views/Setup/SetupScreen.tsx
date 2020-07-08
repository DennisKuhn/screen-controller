import { Typography } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { Root } from '../../../Setup/Application/Root';
import controller from '../../../Setup/Controller/Factory';
import { SetupBase } from '../../../Setup/SetupBase';
import Form from './Form';
//import './Material';
import './Meta/Structure';
import './Meta/MaterialCompact';

const render = (): JSX.Element => {
    const [root, setRoot] = useState(undefined as SetupBase | undefined);

    useEffect(() => {
        controller.getSetup(Root.name, 0)
            .then(setRoot);
    }, []);

    return root ? <Form value={root} /> : <Typography>Loading ...</Typography>;
};

export default render;

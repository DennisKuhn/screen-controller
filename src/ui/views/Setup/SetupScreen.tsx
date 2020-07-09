import { Typography } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { Root } from '../../../Setup/Application/Root';
import controller from '../../../Setup/Controller/Factory';
import { SetupBase } from '../../../Setup/SetupBase';
import Form from './Form';

import './Meta/Structure';
import './Meta/Html';
//import './Meta/HtmlCompact';
//import './Meta/Material';
//import './Meta/MaterialCompact';

// import './Meta/Html'; //TODO multiple imports -> no error
// import './Meta/Html5'; //TODO spelling mistake -> no error

const render = (): JSX.Element => {
    const [root, setRoot] = useState(undefined as SetupBase | undefined);

    useEffect(() => {
        // controller.getSetup(Root.name, 0)
        controller.getSetup(Root.name, -1)
            .then(setRoot);
    }, []);

    return root ? <Form value={root} /> : <Typography>Loading ...</Typography>;
};

export default render;

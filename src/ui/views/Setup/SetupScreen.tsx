import React from 'react';
import { Root } from '../../../Setup/Application/Root';
import Form from './RootForm';

import './Meta/Structure';
//import './Meta/Html';
//import './Meta/HtmlCompact';
//import './Meta/Material';
import './Meta/MaterialCompact';

// import './Meta/Html'; //TODO multiple imports -> no error
// import './Meta/Html5'; //TODO spelling mistake -> no error

const SetupScreen = (): JSX.Element => (
    <Form value={Root.name} />
);

export default SetupScreen;

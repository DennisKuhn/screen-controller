import React, { useState, useEffect } from 'react';
import controller from '../../../Setup/Controller';
import {Screen} from '../../../Setup/Application/Screen';
import Form from './Form';

// export default function DisplaysPage(): JSX.Element {
const ScreenPage = (): JSX.Element => {
    const [screen, setScreen] = useState<Screen | undefined>();

    console.log(`ScreenPage(${screen})`);

    useEffect(() => {
        console.log('ScreenPage.useEffect getSetup');
        controller.getSetup('Screen', -1)
            .then(screen => setScreen(screen as Screen));
    }, []);

    return (screen == undefined?
        (<></>):
        <Form screen={screen} />);
};

export default ScreenPage;

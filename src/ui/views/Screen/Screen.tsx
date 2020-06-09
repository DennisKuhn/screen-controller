import React, { useState, useEffect } from 'react';
import controller from '../../../Setup/Controller';
import {Screen} from '../../../Setup/Application/Screen';
import Form from '../../RjsfComponents/Form';
import { observer } from 'mobx-react-lite';

// export default function DisplaysPage(): JSX.Element {
const ScreenPage = observer( (): JSX.Element => {
    const [screen, setScreen] = useState<Screen | undefined>();

    console.log(`ScreenPage(${screen})`);

    useEffect(() => {
        console.log('ScreenPage.useEffect getSetup');
        controller.getSetup('Screen', -1)
            .then(screen => setScreen(screen as Screen));
    }, []);

    return (screen == undefined?
        (<></>):
        <Form root={screen.getDeep()} schema={screen.getPlainSchema()} />);
});

export default ScreenPage;

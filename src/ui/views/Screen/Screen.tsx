import React, { useState, useEffect, useCallback } from 'react';
import controller from '../../../Setup/Controller';
import {Screen} from '../../../Setup/Application/Screen';
import Form from '../../RjsfComponents/Form';
import { observer } from 'mobx-react-lite';
import { Manager } from '../../../plugins/Manager';


// export default function DisplaysPage(): JSX.Element {
const ScreenPage = observer( (): JSX.Element => {
    const [screen, setScreen] = useState<Screen | undefined>();

    console.log(`ScreenPage(${screen})`);

    const load = async (): Promise<void> => {
        await Manager.loadAll();
        setScreen(
            (await controller.getSetup(Screen.name, -1)) as Screen
        )
    }


    useEffect(() => {
        console.log('ScreenPage.useEffect');
        
        load();
    }, []);

    return (screen == undefined?
        (<></>):
        <Form root={screen} expand={true} schema={screen.getPlainSchema()} />);
});

export default ScreenPage;

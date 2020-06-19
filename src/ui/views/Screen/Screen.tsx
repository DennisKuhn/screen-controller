import React, { useState, useEffect } from 'react';
import controller from '../../../Setup/Controller/Factory';
import {Screen} from '../../../Setup/Application/Screen';
import Form from '../../RjsfComponents/Form';
import { observer } from 'mobx-react-lite';
import { Manager } from '../../../plugins/Manager';


// export default function DisplaysPage(): JSX.Element {
const ScreenLoader = (): JSX.Element => {
    const [screen, setScreen] = useState<Screen | undefined>();

    console.log(`ScreenLoader(${screen?.id})`);

    const load = async (): Promise<void> => {
        console.log('ScreenLoader.load ...');
        await Manager.loadAll();
        setScreen(
            (await controller.getSetup(Screen.name, -1)) as Screen
        );
        console.log('ScreenLoader.load ...ed');
    };


    useEffect(() => {
        console.log('ScreenLoader.useEffect');

        load();
    }, []);

    return (screen == undefined ?
        (<></>) :
        <ScreenPage screen={screen} />);
};

const ScreenPage = observer(({screen}: {screen: Screen}): JSX.Element => {
    console.log(`ScreenPage(${screen.id})`);

    return <Form root={screen} expand={true} schema={screen.getPlainSchema()} />;
});

export default ScreenLoader;

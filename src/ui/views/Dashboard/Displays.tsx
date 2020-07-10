import { observer } from 'mobx-react-lite';
import React, { useEffect, useState, Fragment } from 'react';
import { Screen } from '../../../Setup/Application/Screen';
import controller from '../../../Setup/Controller/Factory';
import DisplayCard from './DisplayCard';
import { remote } from 'electron';
import { callerAndfName } from '../../../utils/debugging';

const electronDisplays = remote.screen.getAllDisplays();

const Displays = observer(({ screen }: { screen: Screen }): JSX.Element => 
    <Fragment>
        {screen.displays.mapEntries(([id, display]) => {
            const info = electronDisplays.find(info => info.id == id);
            if (!info) throw new Error(`${callerAndfName()} can't get electron display info for ${id}`);

            return <DisplayCard key={id} display={display} info={info} />;
        }
        )}
    </Fragment>
);



const DisplaysGetter = (): JSX.Element => {
    const [screen, setScreen] = useState(undefined as Screen | undefined);

    const getScreen = (): void => {
        // get Screen.Displays->.Browsers->
        (controller.getSetup(Screen.name, 2) as Promise<Screen>)
            .then(setScreen);
    };

    useEffect(getScreen, []);

    return screen ? <Displays screen={screen} /> : (<></>);
};

export default DisplaysGetter;
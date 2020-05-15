import * as React from 'react';
import windowsIpc, { CHANNEL, IpcArgs } from '../infrastructure/Windows.ipc';
import controller from '../infrastructure/Configuration/Controller';
import { Screen } from '../infrastructure/Configuration/Screen';

export default function MainWindow(): JSX.Element {
    controller.getSetup(Screen.name, 0).then(
        screen => {
            if ((screen as Screen).displays.size == 0) {
                const windowArgs: IpcArgs = {
                    window: 'ScreenManager',
                    command: 'show'
                };
                windowsIpc.send(CHANNEL, windowArgs);
            }
        }
    );
    
    return <>
        <h1>Main index</h1>
        <div id="wrapper">
            <label>
                <input type="checkbox" id="ScreenManager" onChange={(e): void => {
                    const windowArgs: IpcArgs = {
                        window: 'ScreenManager',
                        command: e.target.checked ? 'show' : 'hide'
                    };
                    windowsIpc.send(CHANNEL, windowArgs);
                }} />
                <span>Screen Manager</span>
            </label>
            <input type='button' id='button' />
        </div>
    </>;
}

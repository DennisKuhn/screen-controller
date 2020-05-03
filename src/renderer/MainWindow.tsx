import * as React from 'react';
import windowsIpc, { CHANNEL, IpcArgs } from '../infrastructure/Windows.ipc';
import controller from '../infrastructure/Configuration/Controller';
import { Setup } from '../infrastructure/Configuration/WallpaperSetup';

export default function MainWindow(): JSX.Element {
    controller.getSetup('Setup', 0).then(
        setup => {
            if ((setup as Setup).children.size == 0) {
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

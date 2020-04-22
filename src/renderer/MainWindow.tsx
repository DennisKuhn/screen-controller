import * as React from 'react';
import windowsIpc, { CHANNEL, IpcArgs } from '../infrastructure/Windows.ipc';

export default function MainWindow(): JSX.Element {
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

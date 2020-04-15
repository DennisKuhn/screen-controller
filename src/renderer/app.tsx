import * as React from 'react';
import * as ReactDOM from 'react-dom';
import '../infrastructure/MainWindow';
import windowsIpc, { CHANNEL, IpcArgs } from '../infrastructure/Windows.ipc';

function MainWindow() {
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
        </div>
    </>;
}

ReactDOM.render(<MainWindow />, document.getElementById('root'));



import * as electron from 'electron';

type Channel = 'windows';

export const CHANNEL: Channel = 'windows';
export type Windows = 'ScreenManager' | 'MainWindow';
export type Commands = 'show' | 'hide';

interface WindowIpcRenderer extends electron.IpcRenderer {
    send(channel: Channel, window: Windows, command: Commands): void;
}

export default electron.ipcRenderer as WindowIpcRenderer;

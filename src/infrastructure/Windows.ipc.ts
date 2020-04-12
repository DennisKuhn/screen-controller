import * as electron from 'electron';

export type Channel = 'windows';

export const CHANNEL: Channel = 'windows';
export type Windows = 'ScreenManager' | 'MainWindow';
export type Commands = 'show' | 'hide';

export interface IpcArgs {
    window: Windows;
    command: Commands;
}

interface WindowIpcRenderer extends electron.IpcRenderer {
    send(channel: Channel, args: IpcArgs): void;
}

export default electron.ipcRenderer as WindowIpcRenderer;

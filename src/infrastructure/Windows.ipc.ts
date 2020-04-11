import * as electron from 'electron';

interface WindowIpcRenderer extends electron.IpcRenderer {
    send(channel: 'windows', displayId: number, command: string): void;
}

export default electron.ipcRenderer as WindowIpcRenderer;

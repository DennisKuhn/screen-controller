import * as electron from 'electron';

interface WindowIpcRenderer extends electron.IpcRenderer {
    send(channel: string, command: string): void;
}

export default electron.ipcRenderer as WindowIpcRenderer;

import * as electron from 'electron';

type Channel = 'wallpapers';

export const CHANNEL: Channel = 'wallpapers';
export type Commands = 'load';

export const FILE_STORAGE_APPENDIX = '-file';

export const Display2StorageKey = (displayId: number): string => {
    return displayId.toString() + FILE_STORAGE_APPENDIX;
};

const STORAGE_KEY_REGEX = new RegExp( `^(?<displayId>[0-9]+)(${FILE_STORAGE_APPENDIX})$` );

export const StorageKey2Display = (storageKey: string): number => {
    const matches = STORAGE_KEY_REGEX.exec(storageKey);

    if (matches.groups.displayId) {
        return Number.parseInt(matches.groups.displayId);
    }
    throw new Error(`Storage key must start with display id and end with ${FILE_STORAGE_APPENDIX}, not: ${storageKey}`);
};

export const IsStorageKey = (storageKey: string): boolean => STORAGE_KEY_REGEX.test(storageKey);

interface WallpapersManagerIpcRenderer extends electron.IpcRenderer {
    send(channel: Channel, displayId: number, command: Commands, file?: string): void;
}

export default electron.ipcRenderer as WallpapersManagerIpcRenderer;

import windowsIpc, { CHANNEL as windowsCHANNEL, Windows, IpcArgs as windowsIpcArgs } from './Windows.ipc';
import wallpapersIpc, { CHANNEL as wallpapersCHANNEL, IsStorageKey, StorageKey2Display, IpcArgs as wallpapersIpcArgs} from './WallpapersManager.ipc';
import { store2url } from '../utils/Url';

class MainWindow {

    static start(): void {
        MainWindow.loadWallpapers();

        // MainWindow.loadWallpapers();

        document.querySelectorAll('input').forEach(
            (windowCheck: HTMLInputElement) => {
                windowCheck.addEventListener('change', () => {
                    const windowArgs: windowsIpcArgs = {
                        window: windowCheck.id as Windows,
                        command: windowCheck.checked ? 'show' : 'hide'
                    };
                    windowsIpc.send(windowsCHANNEL, windowArgs);
                }
                );
            });
    }

    private static loadWallpapers(): void {
        const storage = window.localStorage;
        console.log(`MainWindow.loadWallpapers(): storages ${storage.length}`);
        for (let i = 0; i < storage.length; i += 1) {
            const key = storage.key(i);
            console.log(`MainWindow.loadWallpapers(): try #${i} ${key} = ${IsStorageKey(key)}`);
            if (IsStorageKey(key)) {
                const loadPaperArgs: wallpapersIpcArgs = {
                    displayId: StorageKey2Display(key),
                    command: 'load',
                    file: store2url(storage.getItem(key))
                };
                console.log(`MainWindow.loadWallpapers(): ${key}:`, loadPaperArgs);
                wallpapersIpc.send( wallpapersCHANNEL, loadPaperArgs
                );
            }
        }

    }

}

MainWindow.start();

export default MainWindow;

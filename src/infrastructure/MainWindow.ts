import windowsIpc, { CHANNEL as windowsCHANNEL, Windows } from './Windows.ipc';
import wallpapersIpc, { CHANNEL as wallpapersCHANNEL, IsStorageKey, StorageKey2Display } from './WallpapersManager.ipc';
import { Debugger } from 'electron';

class MainWindow {

    static start(): void {
        MainWindow.loadWallpapers();

        // MainWindow.loadWallpapers();

        document.querySelectorAll('input').forEach(
            (windowCheck: HTMLInputElement) => {
                windowCheck.addEventListener('change', () => {
                    windowsIpc.send(windowsCHANNEL, windowCheck.id as Windows, windowCheck.checked ? 'show' : 'hide');
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
                const fileRecord = storage.getItem(key);
                console.log(`MainWindow.loadWallpapers(): ${key} = ${fileRecord}`);
                wallpapersIpc.send(
                    wallpapersCHANNEL,
                    StorageKey2Display( key ),
                    'load',
                    fileRecord);
            }
        }

    }

}

MainWindow.start();

export default MainWindow;

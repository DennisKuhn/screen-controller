import { remote } from 'electron';
import wallpapersIpc, { CHANNEL as wallpapersCHANNEL, IpcArgs as wallpapersIpcArgs } from './WallpapersManager.ipc';
import ConfigCotroller from './ConfigController';

/** TEST */
import windowsIpc, { CHANNEL as windowsCHANNEL, Windows, IpcArgs as windowsIpcArgs } from './Windows.ipc';

class MainWindow {

    static start(): void {
        MainWindow.loadWallpapers();

        MainWindow.windowTest();
    }

    /**
     * TEST
     */
    private static windowTest(): void {
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

    /**
     * WallpaperManager lives in Main-Thread and doesn't have access to local storage.
     * For each display, get file-url and send to WallpaperMaanager.
     */
    private static loadWallpapers(): void {
        const displays = remote.screen.getAllDisplays();
        console.log(`MainWindow.loadWallpapers(): ${displays.length}`);

        displays.forEach(
            (display, i) => {
                const displayFile = ConfigCotroller.getFile(display.id);

                if (displayFile) {
                    const loadPaperArgs: wallpapersIpcArgs = {
                        displayId: display.id,
                        command: 'load',
                        file: displayFile
                    };
                    console.log(`MainWindow.loadWallpapers(): ${i}:`, loadPaperArgs);
                    wallpapersIpc.send(wallpapersCHANNEL, loadPaperArgs);
                }
            }
        );

    }

}

MainWindow.start();

export default MainWindow;

import windowIpcRenderer from './Windows.ipc';
import wallpapersIpcRenderer from './WallpapersManager.ipc';
import Windows from './Windows';
import WallpapersManager from './WallpapersManager';

class MainWindow {

    static start(): void {
        MainWindow.loadWallpapers();

        document.querySelectorAll('input').forEach(
            (windowCheck: HTMLInputElement) => {
                windowCheck.addEventListener('change', () => {
                    windowIpcRenderer.send(Windows.CHANNEL, parseInt(windowCheck.id), windowCheck.checked ? 'show' : 'hide');
                    }
                );
            });
    }

    private static loadWallpapers(): void {
        const storage = window.localStorage;

        for (let i = 0; i < storage.length; i += 1) {
            const key = storage.key(i);
            if (key.endsWith(WallpapersManager.CHANNEL)) {
                const fileRecord = storage.getItem(key);
                console.log(`MainWindow.loadWallpapers(): ${key} = ${fileRecord}`);
                wallpapersIpcRenderer.send(key, fileRecord);
            }
        }

    }

}

MainWindow.start();

export default MainWindow;

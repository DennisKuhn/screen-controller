import { ipcRenderer } from 'electron';
import Windows from './Windows';
import WallpapersManager from './WallpapersManager';

class MainWindow {

    static start(): void {
        MainWindow.loadWallpapers();

        document.querySelectorAll('input').forEach(
            (windowCheck: HTMLInputElement) => {
                windowCheck.addEventListener('change', () => {
                    ipcRenderer.send( Windows.CHANNEL, windowCheck.id, windowCheck.checked ? 'show' : 'hide');
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
                ipcRenderer.send(key, fileRecord);
            }
        }

    }

}

MainWindow.start();

export default MainWindow;
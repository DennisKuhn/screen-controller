import { app, ipcRenderer } from 'electron';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

class MainWindow {

    static loadWallpapers(): void {
        const storage = window.localStorage;

        for (let i = 0; i < storage.length; i += 1) {
            const key = storage.key(i);
            if (/-file$/.test(key)) {
                const fileRecord = storage.getItem(key);
                console.log(`MainWindow.loadWallpapers(): ${key} = ${fileRecord}`);
                ipcRenderer.send(key, fileRecord);
            }
        }

    }

    static start(): void {
        MainWindow.loadWallpapers();
        document.querySelectorAll('input').forEach(
            (windowCheck: HTMLInputElement) => {
                windowCheck.addEventListener('change', () => {
                    ipcRenderer.send('windows', windowCheck.id, windowCheck.checked ? 'show' : 'hide');
                }
                );
            });
    }
}

MainWindow.start();

export default MainWindow;
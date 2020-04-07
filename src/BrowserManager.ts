import {BrowserWindow, ipcMain, screen} from 'electron';
import WallpaperWindow from './ElectronWallpaperWindow/WallpaperWindow';
import path = require('path');
import Display = Electron.Display;

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

export default class Main {
    static mainWindow: Electron.BrowserWindow;
    static application: Electron.App;
    static ipc = ipcMain;
    static windows: WallpaperWindow[] = [];
    static BrowserWindow: typeof BrowserWindow;

    private static onWindowAllClosed(): void {
        if (process.platform !== 'darwin') {
            Main.application.quit();
        }
    }

    private static onClose(): void {
        // Dereference the window object.
        Main.windows.forEach((w, i) => {
            w.browserWindow.close();
            Main.windows.splice(i, 1);
        });
        Main.mainWindow = null;
    }

    private static onReady(): void {
        Main.setupDisplays();
        Main.createMainWindow();
    }

    /**
     * Called by loadFile, ready-to-show sets initial bounds, calls show to trigger attaching to the desktop and adding to browsers
     *  */
    static createWallpaperWindow(display: Display): WallpaperWindow {
        const windowProperties = {
            webPreferences: {
                nodeIntegration: true
            },
            display: display,
            show: false,
            transparent: true,
        };
        let window: WallpaperWindow;
        try {
            window = new WallpaperWindow(windowProperties);
            window.browserWindow.once('ready-to-show', () => {
                window.browserWindow.show();
            });
            window.browserWindow.once('show', () => {
                Main.windows.push(window);
            });
        } catch (error) {
            console.error(error);
        }
        return window;
    }

    /**
     * creates an IPC channel for each display and connects loadFile
     */
    static setupDisplays(): void {
        // Screen is available when electron.app.whenReady is emitted
        screen.getAllDisplays().forEach((display) => {
            Main.ipc.on(`${display.id}-file`, (e, file) => {
                Main.loadFile(display, file);
            });
        });
    }


    static loadFile(display: Display, file: string): void {
        let window = this.windows.find(w => w.display.id === display.id);

        if (!window) {
            window = Main.createWallpaperWindow(display);
        }
        if (window) {
            window.browserWindow.loadFile(file)
                .then(() => {
                    console.log(`${display.id}: loaded: ${file}`);
                })
                .catch((reason) => {
                    console.error(`${display.id}: Failed loading: ${reason}, file: ${file}`);
                });
        }
    }

    static createMainWindow(): void {
        Main.mainWindow = new Main.BrowserWindow({
            webPreferences: {
                nodeIntegration: true,
                preload: path.join(__dirname, 'preload.js')
            },
            width: 800,
            height: 600,
        });

        Main.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
        Main.mainWindow.on('closed', Main.onClose);

        // Open the DevTools.
        Main.mainWindow.webContents.openDevTools();
    }

    static run(app: Electron.App, browserWindow: typeof BrowserWindow): void {
        // we pass the Electron.App object and the
        // Electron.BrowserWindow into this function
        // so this class has no dependencies. This
        // makes the code easier to write tests for
        Main.BrowserWindow = browserWindow;
        Main.application = app;
        Main.application.on('window-all-closed', Main.onWindowAllClosed);
        app.whenReady().then(Main.onReady);

    }
}

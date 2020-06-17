import { app, BrowserWindow, ipcMain } from 'electron';
import { callerAndfName } from '../utils/debugging';
import { CHANNEL, IpcArgs, Windows as WindowsKeys } from './Windows.ipc';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const SCREEN_MANAGER_WEBPACK_ENTRY: string;

type windowsMap = {
    [key in WindowsKeys]?: BrowserWindow
}

class Windows {
    private static browserWindows: windowsMap = {};

    /**
     * Create IPC Windows.CHANNEL to show/hide windows
     * Create MainWindow
     */
    static start(): void {
        ipcMain.on( CHANNEL, Windows.onWindowMessage);
        Windows.createMainWindow();
    }

    private static onWindowMessage(e, args: IpcArgs): void {
        if (!(args.window in Windows.browserWindows)) {
            switch (args.window) {
                case 'ScreenManager':
                    Windows.createScreenManager();
                    break;
                case 'MainWindow':
                    console.error(`Windows.onWindowMessage(${e}, ${args.window}, ${args.command}) not in ${Object.keys(Windows.browserWindows)}`);
                    break;
                default:
                    console.error(`Windows.onWindowMessage(${e}, ${args.window}, ${args.command}) unkown key, exisiting: ${Object.keys(Windows.browserWindows)}`);
                    break;
            }
        }
        const window = Windows.browserWindows[args.window];

        if (!window) {
            throw new Error(`${callerAndfName()}: window=${args.window} doesn't exist`);
        }
        switch (args.command) {
            case 'show':
            case 'hide':
                window[args.command]();
                break;
            default:
                console.error(`Windows.onWindowMessage(${e}, ${args.window}, ${args.command}) unkown command`);
                break;
        }
    }

    private static createMainWindow(): void {
        const windowKey: WindowsKeys = 'MainWindow';
        const main = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true,
                additionalArguments: [
                    '--mainwindow'
                ]
            },
            x: 780,
            y: 860,
            width: 300,
            height: 200,
        });
        main.on('closed', app.quit);
        main.webContents.openDevTools();

        main.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
        Windows.browserWindows[windowKey] = main;
    }

    private static createScreenManager(): void {
        const windowKey: WindowsKeys = 'ScreenManager';
        const screenManager = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true
            },
            width: 750,
            height: 1775,
        });
        screenManager.webContents.openDevTools();

        screenManager.loadURL(SCREEN_MANAGER_WEBPACK_ENTRY);
        Windows.browserWindows[windowKey] = screenManager;
        screenManager.on('closed', () =>
            delete Windows.browserWindows[windowKey]
        );
    }

}

export default Windows;

import { BrowserWindow, app, ipcMain } from 'electron';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const SCREEN_MANAGER_WEBPACK_ENTRY: string;

class Windows {
    static CHANNEL = 'windows';

    private static browserWindows: { [key: string]: BrowserWindow } = {};

    /**
     * Create IPC Windows.CHANNEL to show/hide windows
     * Create MainWindow
     */
    static start(): void {
        ipcMain.on( Windows.CHANNEL, Windows.onWindowMessage);
        Windows.createMainWindow();
    }

    private static onWindowMessage(e, windowKey: string, command: string): void {
        if (!(windowKey in Windows.browserWindows)) {
            switch (windowKey) {
                case 'screenManager':
                    Windows.createScreenManager();
                    break;
                case 'main':
                    console.error(`Windows.onWindowMessage(${e}, ${windowKey}, ${command}) not in ${Object.keys(Windows.browserWindows)}`);
                    break;
                default:
                    console.error(`Windows.onWindowMessage(${e}, ${windowKey}, ${command}) unkown key, exisiting: ${Object.keys(Windows.browserWindows)}`);
                    break;
            }
        }
        const window = Windows.browserWindows[windowKey];
        switch (command) {            
            case 'show':
            case 'hide':
                window[command]();
                break;
            default:
                console.error(`Windows.onWindowMessage(${e}, ${windowKey}, ${command}) unkown command`);
                break;
        }
    }

    private static createMainWindow(): void {
        const main = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true
            },
            width: 800,
            height: 600,
        });
        main.on('closed', app.quit);
        main.webContents.openDevTools();

        main.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
        Windows.browserWindows['main'] = main;
    }

    private static createScreenManager(): void {
        const screenManager = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true
            },
            width: 800,
            height: 600,
        });
        screenManager.webContents.openDevTools();

        screenManager.loadURL(SCREEN_MANAGER_WEBPACK_ENTRY);
        Windows.browserWindows['screenManager'] = screenManager;
        screenManager.on('closed', () => 
            delete Windows.browserWindows['screenManager']
        );
    }

}

export default Windows;
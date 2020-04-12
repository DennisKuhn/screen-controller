import { ipcMain, screen } from 'electron';
import url, { Url } from 'url';
import WallpaperWindow from '../ElectronWallpaperWindow/WallpaperWindow';
import Display = Electron.Display;
import { CHANNEL, Commands } from './WallpapersManager.ipc';

declare const WALLPAPER_PRELOAD_WEBPACK_ENTRY: string;

interface Wallpaper {
    window?: WallpaperWindow;
    display: Display;
}

interface WallpapersMap {
    [key: number]: Wallpaper;
}


export default class WallpapersManager {
    static run(): void {
        WallpapersManager.setupDisplays();
    }

    private static wallpapers: WallpapersMap = {};

    /**
     * Called by loadFile, ready-to-show sets initial bounds, calls show to trigger attaching to the desktop and adding to browsers
     *  */
    private static createWallpaperWindow(display: Display): void {
        const wallpaperProperties = {
            webPreferences: {
                nodeIntegration: true,
                // preload: `${WallpapersManager.application.getAppPath()}\\src\\infrastructure\\preload.ts`,
                //preload: `${WallpapersManager.application.getAppPath()}/.webpack/main/preload.js`,
                preload: WALLPAPER_PRELOAD_WEBPACK_ENTRY,
                //preload: './preloadLauncher.js',
                additionalArguments: [`--displayid=${display.id}`]
            },
            display: display,
            show: false,
            transparent: true,
        };

        try {
            const window = new WallpaperWindow(wallpaperProperties);
            window.browserWindow.once('ready-to-show', () => {
                window.browserWindow.show();
            });
            WallpapersManager.wallpapers[display.id].window = window;
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * creates an IPC channel for each display and connects loadFile
     */
    private static setupDisplays(): void {
        ipcMain.on(CHANNEL, WallpapersManager.onMessage);
        screen.getAllDisplays().forEach((display) => {
            WallpapersManager.wallpapers[display.id] = { display: display };            
        });
    }

    private static onMessage(e, displayId: number, command: Commands, file?: string): void {
        switch (command) {
            case 'load':
                {
                    const fileUrl = url.parse(file, false, false);
                    WallpapersManager.loadFile(displayId, fileUrl);
                }
                break;
            default:
                throw new Error(`WallpapersManager: illegal command: ${command}! displayId: ${displayId}, file: ${file}`);
        }
    }

    private static loadFile(displayId: number, file: Url): void {
        const wallpaper = WallpapersManager.wallpapers[displayId];

        if (!(wallpaper.window)) {
            WallpapersManager.createWallpaperWindow(wallpaper.display);
        }

        console.log(`WallpapersManager[${displayId}] = ${url.fileURLToPath(file.href)}`);
        //wallpaper.browserWindow.loadURL(file.href)
        wallpaper.window.browserWindow.loadFile(url.fileURLToPath(file.href))
            // .then(() => {
            //     console.log(`${displayId}: loaded: h=${file.href} p=${file.pathname}`);
            // })
            .catch((reason) => {
                console.error(`${displayId}: Failed loading: ${reason}, h=${file.href} f2p=${url.fileURLToPath(file.href)}`);
            });
    }
}

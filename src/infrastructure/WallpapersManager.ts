import { ipcMain, screen } from 'electron';
import Url, { url2fs } from '../utils/Url';
import WallpaperWindow from '../ElectronWallpaperWindow/WallpaperWindow';
import Display = Electron.Display;
import { CHANNEL, IpcArgs } from './WallpapersManager.ipc';

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
                additionalArguments: [
                    `--displayid=${display.id}`,
                    `--displaywidth=${display.workAreaSize.width}`,
                    `--displayheight=${display.workAreaSize.height}`]
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

    private static onMessage(e, args: IpcArgs): void {
        switch (args.command) {
            case 'load':
                {
                    WallpapersManager.loadFile(args.displayId, args.file);
                }
                break;
            default:
                throw new Error(`WallpapersManager: illegal command: ${args.command}! displayId: ${args.displayId}, file: ${args.file}`);
        }
    }

    private static loadFile(displayId: number, file: Url): void {
        const wallpaper = WallpapersManager.wallpapers[displayId];

        if (!(wallpaper.window)) {
            WallpapersManager.createWallpaperWindow(wallpaper.display);
        }

        console.log(`WallpapersManager[${displayId}] = ${url2fs(file)}`);
        //wallpaper.browserWindow.loadURL(file.href)
        wallpaper.window.browserWindow.loadFile(url2fs(file))
            // .then(() => {
            //     console.log(`${displayId}: loaded: h=${file.href} p=${file.pathname}`);
            // })
            .catch((reason) => {
                console.error(`${displayId}: Failed loading: ${reason}, h=${file.href} f2p=${url2fs(file)}`);
            });
    }
}

import { ipcMain, screen } from 'electron';
import url, { Url } from 'url';
import WallpaperWindow from '../ElectronWallpaperWindow/WallpaperWindow';
import Display = Electron.Display;

declare const WALLPAPER_PRELOAD_WEBPACK_ENTRY: string;

export default class WallpapersManager {
    static application: Electron.App;
    static ipc = ipcMain;
    static wallpapers: WallpaperWindow[] = [];


    public static CloseAllBrowsers(): void {
        // Dereference the window object.
        WallpapersManager.wallpapers.forEach((w, i) => {
            w.browserWindow.close();
            WallpapersManager.wallpapers.splice(i, 1);
        });
    }

    /**
     * Called by loadFile, ready-to-show sets initial bounds, calls show to trigger attaching to the desktop and adding to browsers
     *  */
    static createWallpaperWindow(display: Display): WallpaperWindow {
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
       
        let wallpaper: WallpaperWindow;
        try {
            wallpaper = new WallpaperWindow(wallpaperProperties);
            wallpaper.browserWindow.once('ready-to-show', () => {
                wallpaper.browserWindow.show();
            });
            wallpaper.browserWindow.once('show', () => {
                WallpapersManager.wallpapers.push(wallpaper);
            });
        } catch (error) {
            console.error(error);
        }
        return wallpaper;
    }

    /**
     * creates an IPC channel for each display and connects loadFile
     */
    static setupDisplays(): void {
        // Screen is available when electron.app.whenReady is emitted
        screen.getAllDisplays().forEach((display) => {
            const fileStorageKey = `${display.id}-file`;

            WallpapersManager.ipc.on(fileStorageKey, (e, file: string) => {
                // console.log(`${display.id}: IPC on ${display.id}-file s=${file.toString()} ${JSON.stringify(file)}`);
                WallpapersManager.loadFile(display, url.parse(file,false,false));
            });
        });
    }


    static loadFile(display: Display, file: Url): void {
        let wallpaper = this.wallpapers.find(w => w.display.id === display.id);

        if (!wallpaper) {
            wallpaper = WallpapersManager.createWallpaperWindow(display);
        }
        if (wallpaper) {
            console.log(`WallpapersManager[${display.id}] = ${url.fileURLToPath(file.href)}`);
            //wallpaper.browserWindow.loadURL(file.href)
            wallpaper.browserWindow.loadFile(url.fileURLToPath( file.href ))
                .then(() => {
                    // console.log(`${display.id}: loaded: h=${file.href} p=${file.pathname}`);
                })
                .catch((reason) => {
                    console.error(`${display.id}: Failed loading: ${reason}, h=${file.href} f2p=${url.fileURLToPath(file.href)}`);
                });
        }
    }


    static run(): void {
        WallpapersManager.setupDisplays();
    }
}

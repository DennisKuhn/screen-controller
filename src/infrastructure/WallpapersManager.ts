import WallpaperWindow from '../ElectronWallpaperWindow/WallpaperWindow';
import controller from './Configuration/Controller';
import { Screen, Browser, Display, ScreenID } from './Configuration/WallpaperSetup';
import { autorun } from 'mobx';


declare const WALLPAPER_PRELOAD_WEBPACK_ENTRY: string;
declare const WALLPAPER_WEBPACK_ENTRY: string;


export default class WallpapersManager {

    private static screen: Screen | undefined;

    /**
     * Maps Browser.id to WallpaperWindow
     */
    private static papers: Map<string, WallpaperWindow> = new Map<string, WallpaperWindow>();

    public static async run(): Promise<void> {
        //console.log('WallpapersManager.run');

        const screenId: ScreenID = 'Screen';

        WallpapersManager.screen = (await controller.getSetup(screenId, 2)) as Screen;

        autorun(
            WallpapersManager.updateDisplays
        );
    }

    /**
     * Called by loadFile, ready-to-show sets initial bounds, calls show to trigger attaching to the desktop and adding to browsers
     *  */
    private static createWallpaperWindow(displayId: number, browser: Browser): void {
        const wallpaperProperties = {
            webPreferences: {
                nodeIntegration: true,
                preload: WALLPAPER_PRELOAD_WEBPACK_ENTRY,
                additionalArguments: [
                    `--browserid=${browser.id}`
                ]
            },
            displayId: displayId,
            browser: browser,
            show: false,
            transparent: true,
        };

        let window: WallpaperWindow;

        try {
            window = new WallpaperWindow(wallpaperProperties);

            window.browserWindow.once('ready-to-show', () => {
                window.browserWindow.show();
            });
            // window.on('resized', (e, data) => {
            //     // console.log(data.width);
            // });
            window.browserWindow.loadURL(WALLPAPER_WEBPACK_ENTRY)
                // .then(() => console.log(`WallpapersManager.createWallpaperWindow[${browser.id}]: loaded: ${WALLPAPER_WEBPACK_ENTRY}`))
                .catch((reason) => {
                    console.error(`WallpapersManager.createWallpaperWindow[${browser.id}]: Failed loading: ${reason} = ${WALLPAPER_WEBPACK_ENTRY}`);
                });

            WallpapersManager.papers.set(browser.id, window);
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * creates a WallpaperWindow for each configured browser
     */
    private static updateDisplays = (): void => {

        if (!WallpapersManager.screen) throw new Error('WallpapersManager.updateDisplays(): no screen');

        console.log('WallpapersManager.updateDisplays()');

        for (const display of WallpapersManager.screen.children.values()) {
            if (display) {
                autorun(() => WallpapersManager.updateBrowsers(display));
            }
        }
        for (const paper of WallpapersManager.papers.values()) {
            if (!WallpapersManager.screen.children.has(paper.displayId.toFixed(0))) {
                console.log(`WallpapersManager.updateDisplays(${paper.displayId}) close ${paper.browser.id}`);
                paper.browserWindow.close();
                WallpapersManager.papers.delete(paper.browser.id);
            }
        }
    }

    private static updateBrowsers(display: Display): void {
        console.log(`WallpapersManager.updateBrowsers(${display.id})`);
        for (const browser of display.children.values()) {
            if (browser) {
                WallpapersManager.updateBrowser(Number(display.id), browser);
            }
            // autorun(
            //     () => WallpapersManager.updateBrowser(Number(display.id), browser),
            //     {
            //         delay: 1,
            //         name: `WallpapersManager.updateBrowser(${display.id}, ${browser.id})`
            //     }
            // );
        }
        for (const paper of WallpapersManager.papers.values()) {
            if ((paper.displayId == Number(display.id)) && (!display.children.has(paper.browser.id))) {
                console.log(`WallpapersManager.updateBrowsers(${display.id}) close ${paper.browser.id}`);
                paper.browserWindow.close();
                WallpapersManager.papers.delete(paper.browser.id);
            }
        }
    }

    private static updateBrowser(displayId: number, browser: Browser): void {
        const paper = WallpapersManager.papers.get(browser.id);

        console.log(`WallpapersManager.updateBrowser(${displayId}, ${browser.id}) ${paper}`);

        if (paper) {
            console.error(`WallpapersManager.updateBrowser(${displayId}, ${browser.id}) already exists`);
        } else {
            WallpapersManager.createWallpaperWindow(
                displayId,
                browser
            );
        }

    }
}

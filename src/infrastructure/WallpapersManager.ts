import WallpaperWindow from '../ElectronWallpaperWindow/WallpaperWindow';
import controller from './Configuration/Controller';
import { Setup, Browser, Display } from './Configuration/WallpaperSetup';
import { autorun } from 'mobx';


declare const WALLPAPER_PRELOAD_WEBPACK_ENTRY: string;
declare const WALLPAPER_WEBPACK_ENTRY: string;


export default class WallpapersManager {

    private static setup: Setup | undefined;

    /**
     * Maps Browser.id to WallpaperWindow
     */
    private static papers: Map<string, WallpaperWindow> = new Map<string, WallpaperWindow>();

    public static async run(): Promise<void> {
        //console.log('WallpapersManager.run');

        controller.on('init', WallpapersManager.onSetupInit);
    }

    private static onSetupInit = (setup: Setup): void => {
        // console.log('WallpapersManager.onSetupInit:', setup);

        WallpapersManager.setup = setup;

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

            WallpapersManager.papers.set(browser.id,  window);
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * creates a WallpaperWindow for each configured browser
     */
    private static updateDisplays = (): void => {

        if (!WallpapersManager.setup) throw new Error('WallpapersManager.updateDisplays(): no setup');

        console.log('WallpapersManager.updateDisplays()');

        for (const display of WallpapersManager.setup.displays.values()) {
            autorun( () => WallpapersManager.updateBrowsers(display) );
        }
        for (const paper of WallpapersManager.papers.values()) {
            if (!WallpapersManager.setup.displays.has(paper.displayId.toFixed(0))) {
                paper.browserWindow.close();
                WallpapersManager.papers.delete(paper.browser.id);
            }
        }
    }

    private static updateBrowsers(display: Display): void {
        console.log(`WallpapersManager.updateBrowsers(${display.id})`);
        for (const browser of display.browsers.values()) {
            autorun( () => WallpapersManager.updateBrowser(Number(display.id), browser) );
        }
        for (const paper of WallpapersManager.papers.values()) {
            if (!display.browsers.has(paper.browser.id)) {
                paper.browserWindow.close();
                WallpapersManager.papers.delete(paper.browser.id);
            }
        }
    }

    private static updateBrowser(displayId: number, browser: Browser): void {
        console.log(`WallpapersManager.updateBrowser(${displayId}).${browser.id}`);
        const paper = WallpapersManager.papers.get(browser.id);

        if (paper) {
            paper.browser = browser;
        } else {
            WallpapersManager.createWallpaperWindow(
                displayId,
                browser
            );
        }

    }
}

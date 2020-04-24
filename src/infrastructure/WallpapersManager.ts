import WallpaperWindow from '../ElectronWallpaperWindow/WallpaperWindow';
import controller from './Configuration/Controller';
import { Setup, Browser, SetupDiff, IterableNumberDictionary } from './Configuration/WallpaperSetup';
import { Dictionary } from 'lodash';

declare const WALLPAPER_PRELOAD_WEBPACK_ENTRY: string;
declare const WALLPAPER_WEBPACK_ENTRY: string;


export default class WallpapersManager {

    private static setup: Setup | undefined;
    private static papers: IterableNumberDictionary<WallpaperWindow> = {};

    public static async run(): Promise<void> {
        //console.log('WallpapersManager.run');

        controller.on('init', WallpapersManager.onSetupInit);
        controller.on('change', WallpapersManager.onSetupChanged);

    }

    private static onSetupInit = (setup: Setup): void => {
        // console.log('WallpapersManager.onSetupInit:', setup);

        WallpapersManager.setup = setup;

        WallpapersManager.setupDisplays();
    }

    private static onSetupChanged = (change: SetupDiff): void => {
        if (!WallpapersManager.setup) throw new Error('WallpapersManager.onSetupChanged(): no setup');

        console.log('WallpapersManager.onSetupChanged()', change);

        for (const display of change.displays) {
            if (display) {
                for (const browserId in display.browsers) {
                    const browserUpdate = display.browsers[browserId];
                    const mergedBrowser = { ...WallpapersManager.setup.displays[display.id].browsers[browserId], browserUpdate };

                    if (browserUpdate == null) { // Close removed browser
                        WallpapersManager.papers[browserId].browserWindow.close();
                        delete WallpapersManager.papers[browserId];
                    } else if (browserId in WallpapersManager.papers) {
                        WallpapersManager.papers[browserId].browser = mergedBrowser;
                    } else {
                        WallpapersManager.createWallpaperWindow(
                            display.id,
                            mergedBrowser
                        );
                    }
                }
            } else {
                // display removed
            }
        }
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
            window.on('resized', (e, data) => {
                // console.log(data.width);
            });
            window.browserWindow.loadURL(WALLPAPER_WEBPACK_ENTRY)
                // .then(() => console.log(`WallpapersManager.createWallpaperWindow[${browser.id}]: loaded: ${WALLPAPER_WEBPACK_ENTRY}`))
                .catch((reason) => {
                    console.error(`WallpapersManager.createWallpaperWindow[${browser.id}]: Failed loading: ${reason} = ${WALLPAPER_WEBPACK_ENTRY}`);
                });

            WallpapersManager.papers[browser.id] = window;
        } catch (error) {
            console.error(error);
        }
    }

    /**
     * creates a WallpaperWindow for each configured browser
     */
    private static setupDisplays(): void {

        if (!WallpapersManager.setup) throw new Error('WallpapersManager.setupDisplays(): no setup');

        // console.log('WallpapersManager.setupDisplays()');

        for (const display of WallpapersManager.setup.displays) {
            for (const browser of display.browsers) {
                WallpapersManager.createWallpaperWindow(
                    display.id,
                    browser
                );
            }
        }
    }

}

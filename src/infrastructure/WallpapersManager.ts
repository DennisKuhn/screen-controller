import WallpaperWindow from '../ElectronWallpaperWindow/WallpaperWindow';
import controller from '../Setup/Controller';
import { Screen } from '../Setup/Application/Screen';
import { Browser } from '../Setup/Application/Browser';
import { Display } from '../Setup/Application/Display';
import { IMapDidChange } from 'mobx';


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

        WallpapersManager.screen = (await controller.getSetup(Screen.name, 2)) as Screen;

        WallpapersManager.screen.displays.observe(WallpapersManager.updateDisplays);

        WallpapersManager.connectDisplays();

        /** @TODO Create existing */
    }

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

    private static connectDisplays(): void {
        if (!WallpapersManager.screen) throw new Error('WallpapersManager.connectDisplays(): no screen');

        for (const display of WallpapersManager.screen.displays.values()) {
            if (!display) throw new Error('WallpapersManager.connectDisplays() null display');
            
            display.browsers.observe(WallpapersManager.updateBrowsers);
            
            for (const browser of display.browsers.values()) {
                if (!browser) throw new Error(`WallpapersManager.connectDisplays[${display.id}] null browser`);

                WallpapersManager.createWallpaperWindow(
                    Number(display.id),
                    browser
                );
            }
        }
    }

    /**
     * creates a WallpaperWindow for each configured browser
     */
    private static updateDisplays = (changes: IMapDidChange<string, Display | null>): void => {

        if (!WallpapersManager.screen) throw new Error('WallpapersManager.updateDisplays(): no screen');

        // console.log('WallpapersManager.updateDisplays()');

        switch (changes.type) {
            case 'add':
                if (changes.newValue) {
                    changes.newValue.browsers.observe(WallpapersManager.updateBrowsers);
                }
                break;
            case 'delete':
                if (!changes.oldValue)
                    throw new Error(`WallpapersManager.updateDisplays(${changes.type}}) no oldValue`);

                for (const browser of changes.oldValue.browsers.values()) {
                    if (!browser)
                        throw new Error(`WallpapersManager.updateDisplays(${changes.type}}) null browser`);
                    
                    const paper = WallpapersManager.papers.get(browser.id);

                    if (!paper)
                        throw new Error(`WallpapersManager.updateDisplays(${changes.type}, ${changes.oldValue.id}) no paper for ${browser.id}`);
                    
                    // console.log(`WallpapersManager.updateDisplays(${paper.displayId}) close ${paper.browser.id}`);
                    paper.browserWindow.close();
                    WallpapersManager.papers.delete(paper.browser.id);
                }
                break;
            case 'update':
                throw new Error(`WallpapersManager.updateDisplays(${changes.type}})`);
                break;
        }

    }

    private static updateBrowsers(changes: IMapDidChange<string, Browser | null>): void {
        // console.log(`WallpapersManager.updateBrowsers(${display.id})`);
        switch (changes.type) {
            case 'add':
                if (changes.newValue == null) {
                    console.log((`WallpapersManager.updateBrowsers(${changes.type}, ${changes.name}}) = null`));
                } else {
                    WallpapersManager.createWallpaperWindow(
                        Number(changes.newValue.parentId),
                        changes.newValue
                    );
                }
                break;
            case 'update':
                if (changes.oldValue != null) {
                    throw new Error(`WallpapersManager.updateBrowsers(${changes.type}, ${changes.name}) from ${changes.oldValue.id} to ${changes.newValue?.id}`);
                } else if (changes.newValue == null) {
                    throw new Error(`WallpapersManager.updateBrowsers(${changes.type}, ${changes.name}) from null to null`);
                } else {
                    WallpapersManager.createWallpaperWindow(
                        Number(changes.newValue.parentId),
                        changes.newValue
                    );
                }
                break;
            case 'delete':
                if (!changes.oldValue)
                    throw new Error(`WallpapersManager.updateBrowsers(${changes.type}, ${changes.name}}) no oldValue`);
                else {
                    const paper = WallpapersManager.papers.get(changes.oldValue.id);

                    if (!paper)
                        throw new Error(`WallpapersManager.updateBrowsers(${changes.type}, ${changes.oldValue.id}}) no paper`);

                    // console.log(`WallpapersManager.updateBrowsers(${display.id}) close ${paper.browser.id}`);
                    paper.browserWindow.close();
                    WallpapersManager.papers.delete(paper.browser.id);
                }
                break;
        }
    }
}

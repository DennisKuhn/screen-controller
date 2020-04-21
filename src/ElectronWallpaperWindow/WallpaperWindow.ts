import { BrowserWindow, BrowserWindowConstructorOptions, remote } from 'electron';
import nodeWinWallpaper from 'node-win-wallpaper';
import ScreenBounds, { DisplayBounds } from './ScreenBounds';
import { EventEmitter } from 'events';
import { Browser } from '../infrastructure/Configuration/WallpaperSetup';

interface WallpaperWindowConstructorOptions extends BrowserWindowConstructorOptions {
    displayId: number;
    browser: Browser;
}

class WallpaperWindow extends EventEmitter {
    displayId: number;
    browser: Browser;
    browserWindow: BrowserWindow;
    _attached = false;
    private currentBounds: DisplayBounds | undefined;

    constructor(options?: WallpaperWindowConstructorOptions) {
        super();
        let windowOptions: BrowserWindowConstructorOptions = {};

        if (options) {
            const { displayId, browser, ...otherWindowOptions } = options;

            this.displayId = displayId;
            this.browser = browser;
            windowOptions = otherWindowOptions;
        } else {
            this.displayId = remote.screen.getPrimaryDisplay().id;
            this.browser = { id: this.displayId, rx: 0, ry: 0, rWidth: 1, rHeight: 1 };
        }

        const displayBounds = ScreenBounds.findBoundsByDisplayId(this.displayId);

        if (!displayBounds) throw new Error(`${this.constructor.name}():Can not receive bounds for display ${this.displayId}`);

        this.currentBounds = {
            displayId: displayBounds.displayId,
            x: displayBounds.x + (this.browser.rx * displayBounds.width),
            y: displayBounds.y + (this.browser.ry * displayBounds.height),
            width: this.browser.rWidth * displayBounds.width,
            height: this.browser.rHeight * displayBounds.height
        };

        windowOptions.webPreferences = windowOptions.webPreferences ?? {};
        windowOptions.webPreferences.additionalArguments = windowOptions.webPreferences.additionalArguments ?? [];
        windowOptions.webPreferences.additionalArguments.push(
            `--displaywidth=${this.currentBounds?.width}`,
            `--displayheight=${this.currentBounds?.height}`
        );

        this.browserWindow = new BrowserWindow({
            frame: false,
            ...windowOptions
        });

        this.browserWindow.once('show', () => {
            try {
                this.attach();
            } catch (error) {
                this.browserWindow.close();
                throw error;
            }
        });
        ScreenBounds.on('bounds-changed', () => {
            this.fitToDisplay();
            this.emit('resized', { bounds: this.currentBounds });
        });

    }

    private attach(): void {
        if (!this._attached) {
            this.browserWindow.webContents.openDevTools({ mode: 'detach' });

            const handle = this.browserWindow.getNativeWindowHandle();
            nodeWinWallpaper.attachWindow(handle);
            this._attached = true;
            this.fitToDisplay();
        }
    }

    private fitToDisplay(): void {
        const displayBounds = ScreenBounds.findBoundsByDisplayId(this.displayId);
        if (displayBounds) {
            // this.currentBounds = displayBounds;
            this.currentBounds = {
                displayId: displayBounds.displayId,
                x: displayBounds.x + (this.browser.rx * displayBounds.width),
                y: displayBounds.y + (this.browser.ry * displayBounds.height),
                width: this.browser.rWidth * displayBounds.width,
                height: this.browser.rHeight * displayBounds.height
            };
            const handle = this.browserWindow.getNativeWindowHandle();
            nodeWinWallpaper.moveWindow(handle, this.currentBounds);
        }
    }

    get attached(): boolean {
        return this._attached;
    }
    on(event: 'resized', listener: (event: Event, bounds: DisplayBounds) => void): this {
        return super.on(event, listener);
    }

    once(event: 'resized', listener: (event: Event, bounds: DisplayBounds) => void): this {
        return super.once(event, listener);
    }

    addListener(event: 'resized', listener: (event: Event, bounds: DisplayBounds) => void): this {
        return super.addListener(event, listener);
    }

    removeListener(event: 'resized', listener: (event: Event, bounds: DisplayBounds) => void): this {
        return super.removeListener(event, listener);
    }

}


export default WallpaperWindow;

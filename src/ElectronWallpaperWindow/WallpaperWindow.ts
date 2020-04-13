import { BrowserWindow, BrowserWindowConstructorOptions, Display } from 'electron';
import nodeWinWallpaper from 'node-win-wallpaper';
import ScreenBounds, { DisplayBounds } from './ScreenBounds';
import { EventEmitter } from 'events';

interface WallpaperWindowConstructorOptions extends BrowserWindowConstructorOptions {
    display: Display;
}

class WallpaperWindow extends EventEmitter {
    display: Display;
    browserWindow: BrowserWindow;
    _attached = false;
    private currentBounds: DisplayBounds;

    constructor(options?: WallpaperWindowConstructorOptions) {
        super();
        const { display, ...windowOptions } = options;
        this.display = display;
        this.browserWindow = new BrowserWindow({ frame: false, ...windowOptions });
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
        const displayBounds = ScreenBounds.findBoundsByDisplayId(this.display.id);
        if (displayBounds) {
            this.currentBounds = displayBounds;
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

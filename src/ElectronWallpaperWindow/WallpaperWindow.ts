import {BrowserWindow, BrowserWindowConstructorOptions, Display} from 'electron';
import nodeWinWallpaper from 'node-win-wallpaper';
import ScreenBounds from './ScreenBounds';

interface WallpaperWindowConstructorOptions extends BrowserWindowConstructorOptions {
    display: Display;
}

class WallpaperWindow {
    display: Display;
    browserWindow: BrowserWindow;
    _attached = false;

    constructor(options?: WallpaperWindowConstructorOptions) {
        const {display, ...windowOptions} = options;
        this.display = display;
        this.browserWindow = new BrowserWindow({ frame: false, ...windowOptions});
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
            const handle = this.browserWindow.getNativeWindowHandle();
            nodeWinWallpaper.moveWindow(handle, displayBounds);
        }
    }

    get attached(): boolean {
        return this._attached;
    }
}


export default WallpaperWindow;

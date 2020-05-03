import { Rectangle as ElectronRectangle, BrowserWindow, BrowserWindowConstructorOptions, screen } from 'electron';
import nodeWinWallpaper from 'node-win-wallpaper';
import ScreenBounds, { DisplayBounds } from './ScreenBounds';
import { EventEmitter } from 'events';
import { Browser, Rectangle, RectangleInterface, SetupItem } from '../infrastructure/Configuration/WallpaperSetup';
import { autorun, reaction } from 'mobx';
import { isEqual } from 'lodash';

interface WallpaperWindowConstructorOptions extends BrowserWindowConstructorOptions {
    displayId: number;
    browser: Browser;
}

class WallpaperWindow extends EventEmitter {
    displayId: number;
    _browser: Browser;
    browserWindow: BrowserWindow;
    nativeHandle: Buffer | undefined;
    _attached = false;
    private displayBounds: DisplayBounds;
    private displayScaledBounds: ElectronRectangle;

    constructor(options: WallpaperWindowConstructorOptions) {
        super();

        const { displayId, browser, ...windowOptions } = options;

        this.displayId = displayId;
        this._browser = browser;

        this.displayBounds = this.setSystemBounds();
        this.displayScaledBounds = this.setScaledSystemBounds();

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
            this.setSystemBounds();
            this.setScaledSystemBounds();
            this.updateBrowserBounds();

            this.fitToDisplay();
            this.emit('resized', { bounds: this.browser.scaled });
        });
    }

    private setSystemBounds(): DisplayBounds {
        const displayBounds = ScreenBounds.findBoundsByDisplayId(this.displayId);

        if (!displayBounds)
            throw new Error(`${this.constructor.name}[${this.browser.id}].updateSystemBounds():Can not receive bounds for display ${this.displayId}`);

        this.displayBounds = displayBounds;

        return this.displayBounds;
    }

    private setScaledSystemBounds(): ElectronRectangle {
        const scaledRect = screen.getAllDisplays().find(display => display.id == this.displayId)?.workArea;

        if (!scaledRect)
            throw new Error(`${this.constructor.name}():Can not get workArea for displayId ${this.displayId}`);

        this.displayScaledBounds = scaledRect;

        return this.displayScaledBounds;
    }

    private updateBrowserBounds(): boolean {
        let changed = false;

        const newDevice: RectangleInterface = {
            id: this.browser.device?.id ?? SetupItem.getNewId('Rectangle'),
            className: 'Rectangle',
            x: this.displayBounds.x + (this.browser.relative.x * this.displayBounds.width),
            y: this.displayBounds.y + (this.browser.relative.y * this.displayBounds.height),
            width: this.browser.relative.width * this.displayBounds.width,
            height: this.browser.relative.height * this.displayBounds.height
        };

        if (!isEqual(this.browser.device?.getPlainFlat(), newDevice)) {
            console.log(
                `${this.constructor.name}[${this.browser.id}].updateBrowserBounds device` +
                (this.browser.device ? ` ${this.browser.device.x},${this.browser.device.y} ${this.browser.device.width}*${this.browser.device.height}` : ' noDevice') +
                ` ${newDevice.x}, ${newDevice.y} ${newDevice.width} * ${newDevice.height}`
            );
            this.browser.device = new Rectangle(newDevice);
            changed = true;
        }

        const newScaled: RectangleInterface = {
            id: this.browser.scaled?.id ?? SetupItem.getNewId('Rectangle'),
            className: 'Rectangle',
            x: this.displayScaledBounds.x + (this.displayScaledBounds.width * this.browser.relative.x),
            y: this.displayScaledBounds.y + (this.displayScaledBounds.height * this.browser.relative.x),
            width: this.displayScaledBounds.width * this.browser.relative.width,
            height: this.displayScaledBounds.height * this.browser.relative.height
        };

        if (!isEqual(this.browser.scaled?.getPlainFlat(), newScaled)) {
            console.log(
                `${this.constructor.name}[${this.browser.id}].updateBrowserBounds scaled` +
                (this.browser.scaled ? ` ${this.browser.scaled.x},${this.browser.scaled.y} ${this.browser.scaled.width}*${this.browser.scaled.height}` : ' noDevice') +
                ` ${newScaled.x}, ${newScaled.y} ${newScaled.width} * ${newScaled.height}`
            );
            this.browser.scaled = new Rectangle( newScaled);
            changed = true;
        }

        return changed;
    }


    get browser(): Browser {
        return this._browser;
    }

    private attach(): void {
        if (!this._attached) {
            this.browserWindow.webContents.openDevTools({ mode: 'detach' });

            this.nativeHandle = this.browserWindow.getNativeWindowHandle();
            nodeWinWallpaper.attachWindow(this.nativeHandle);
            this._attached = true;

            reaction(
                (/*r*/) => {
                    console.log(
                        `${this.constructor.name}[${this.browser.id}]-updateBounds get` +
                        ` ${this.browser.relative.x},${this.browser.relative.y} ${this.browser.relative.width}*${this.browser.relative.height}`);
                    return this.browser.relative;
                },
                () => {
                    console.log(
                        `${this.constructor.name}[${this.browser.id}]-updateBounds set` +
                        ` ${this.browser.relative.x},${this.browser.relative.y} ${this.browser.relative.width}*${this.browser.relative.height}`);
                    this.updateBrowserBounds();
                    this.fitToDisplay();
                },
                {
                    name: `${this.constructor.name}[${this.browser.id}]-updateBounds`,
                    fireImmediately: true,
                    equals: (a, b) => {
                        const result = a.x == b.x && a.y == b.y && a.width == b.width && a.height == b.height;
                        console.log(
                            `${this.constructor.name}[${this.browser.id}]-updateBounds test ${result}=` +
                            ` ${a.x},${a.y} ${a.width}*${a.height} =?= ${b.x},${b.y} ${b.width}*${b.height}`
                        );

                        return result;
                    }
                }
            );

        }
    }

    private fitToDisplay(): void {
        if (!this.nativeHandle) throw new Error(`${this.constructor.name}.fitToDisplay: No handle for browser ${this.browser.id} @ ${this.displayId}`);
        if (!this.browser.device) throw new Error(`${this.constructor.name}.fitToDisplay: No device rectangle for browser ${this.browser.id} @ ${this.displayId}`);

        nodeWinWallpaper.moveWindow(
            this.nativeHandle,
            this.browser.device
        );
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

import { EventEmitter } from 'events';
import electron, { IpcRendererEvent, IpcMainEvent, BrowserWindow, ipcMain as electronIpcMain, ipcRenderer as electronIpcRenderer } from 'electron';
import { Setup, SetupDiff, Config, SetupInterface, SetupDiffInterface, Properties } from './WallpaperSetup';
import { cloneDeep, mergeWith } from 'lodash';

import DefaultConfig from '../../wallpaper/project.json';

interface BrowserConfig {
    [key: number]: Config;
}

type InitialSetupChannel = 'init';
type SetupChangeChannel = 'change';

interface IpcRenderer extends electron.IpcRenderer {
    send(channel: InitialSetupChannel, update: SetupInterface): void;
    send(channel: SetupChangeChannel, update: SetupDiffInterface): void;

    on(channel: SetupChangeChannel, listener: (event: IpcRendererEvent, update: SetupDiffInterface, persist?: boolean) => void): this;
}

interface IpcMain extends electron.IpcMain {
    on(channel: SetupChangeChannel, listener: (event: IpcMainEvent, update: SetupDiffInterface) => void): this;

    once(channel: InitialSetupChannel, listener: (event: IpcMainEvent, update: SetupInterface) => void): this;
}

interface IpcWindow extends electron.WebContents {
    send(channel: SetupChangeChannel, update: SetupDiffInterface, persist?: boolean): void;
}


type InitialSetupEvent = 'init';
type SetupChangeEvent = 'change';

type SetupListener = (setup: Setup) => void;
type DiffListener = (update: SetupDiff) => void;


export declare interface Controller {
    on(event: InitialSetupEvent, listener: SetupListener): this;
    on(event: SetupChangeEvent, listener: DiffListener): this;

    once(event: InitialSetupEvent, listener: SetupListener): this;
    once(event: SetupChangeEvent, listener: DiffListener): this;

    getSetup(includeConfig: boolean): Promise<Setup>;
    updateSetup(update: SetupDiff): void;

    log(): void;
}


declare interface ControllerImpl {
    emit(event: InitialSetupEvent, setup: Setup): boolean;
    emit(event: SetupChangeEvent, update: SetupDiff): boolean;
}

/**
 */
abstract class ControllerImpl extends EventEmitter implements Controller {
    protected setup: Setup | undefined;
    protected configs: BrowserConfig = {};
    protected loadedAllConfig = false;
    protected abstract getAllWindows: () => Electron.BrowserWindow[];

    protected constructor() {
        super();
        console.log(`Config.ControllerImpl(${this.constructor.name})`);
    }

    log(): void {
        console.log(`${this.constructor.name}.log()`);
    }

    protected get fullSetup(): Setup {
        if (!this.setup) throw new Error(`${this.constructor.name}.get fullSetup: no setup`);

        const fullSetup: Setup = cloneDeep(this.setup);

        for (const display of fullSetup.displays) {
            for (const browser of display.browsers) {
                if (browser.id in this.configs) {
                    browser.config = this.configs[browser.id];
                }
            }
        }

        return fullSetup;
    }

    protected processSetupChange(update: SetupDiff): void {
        console.log(`${this.constructor.name}.processSetupChange() ${JSON.stringify(update)} => ${JSON.stringify(this.setup)} + ${JSON.stringify(this.configs)}`);
        if (!this.setup) throw new Error(`${this.constructor.name}.processSetupChange: no setup`);

        mergeWith(
            this.setup.displays,
            update.displays,
            (existingDisplay, newDisplay/*, displayId, object , source, stack */) => {
                if (existingDisplay && newDisplay) {
                    return mergeWith(
                        existingDisplay,
                        newDisplay,
                        (objValue, srcValue, key/*, object , source, stack */) => {
                            if (key === 'browsers') {
                                return mergeWith(
                                    objValue,
                                    srcValue,
                                    (existingBrowser, newBrowser, /*browserId, object , source, stack */) => {
                                        if (existingBrowser && newBrowser) {
                                            return mergeWith(
                                                existingBrowser,
                                                newBrowser,
                                                (objValue, srcValue, key, object /*, source, stack */) => {
                                                    if (key === 'config') {
                                                        console.log(`${this.constructor.name}.processSetupChange: split config[${object.id}]: ${srcValue}`);
                                                        this.configs[object.id] = srcValue.config;
                                                        return null;
                                                    }
                                                }
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            }
        );

        console.log(`${this.constructor.name}.processedSetupChange() ${JSON.stringify(update)} => ${JSON.stringify(this.setup)} + ${JSON.stringify(this.configs)}`);
    }

    protected updateAllWindows(update: SetupDiff, persist?: boolean): void {
        console.log(`${this.constructor.name}.updateAllWindows: ${update}`);

        for (const window of this.getAllWindows()) {
            const ipcWindow = window.webContents as IpcWindow;

            console.log(`${this.constructor.name}.updateAllWindows: send to ${window.id}.${window.getBrowserView()?.id} persist=${persist}`);

            ipcWindow.send('change', update, persist);

            persist = undefined;
        }
    }


    abstract getSetup(includeConfig: boolean): Promise<Setup>;

    abstract updateSetup(update: SetupDiff): void;
}



class Renderer extends ControllerImpl {
    protected getAllWindows = electron.remote.BrowserWindow.getAllWindows;

    private static SETUP_KEY = 'Setup';

    private ipc: IpcRenderer = electronIpcRenderer;

    constructor() {
        super();

        console.log(`${this.constructor.name}()`);

        this.getAllWindows = electron.remote.BrowserWindow.getAllWindows;

        this.setup = this.loadSetup();

        this.ipc.send('init', this.setup);

        this.ipc.on('change', this.onSetupChanged);
    }

    updateSetup(update: SetupDiff): void {
        //this.emit(Controller.change, update);
        this.processSetupChange(update);

        this.emit('change', update);
        this.ipc.send('change', update);
        this.updateAllWindows(update, false);

        this.storeSetup();
    }

    // onSetupChanged = (e, update: SetupDiffInterface, persist?: boolean): void => {
    onSetupChanged = (e, update: SetupDiffInterface, persist?: boolean): void => {
        const updateObj = new SetupDiff(update);
        console.log(`${this.constructor.name}.onSetupChanged`, update, updateObj);
        // this.emit(Controller.change, new SetupDiff(update));
        this.processSetupChange(updateObj);

        this.emit('change', updateObj);

        if (persist && (persist === true)) {
            this.storeSetup();
        }
    }

    async getSetup(includeConfig: boolean): Promise<Setup> {
        let response: Setup;

        if (includeConfig && (!this.loadedAllConfig)) {
            this.loadAllConfig();
        }

        if (includeConfig) {
            response = this.fullSetup;
        } else {
            if (!this.setup) throw new Error(`${this.constructor.name}.getSetup(${includeConfig}): no setup`);

            response = this.setup;
        }

        return response;
    }

    private loadSetup(): Setup {
        console.log(`${this.constructor.name}: loadSetup`);
        const setupString = localStorage.getItem(Renderer.SETUP_KEY);

        if (setupString) {
            this.setup = new Setup(JSON.parse(setupString));
        } else {
            console.warn(`${this.constructor.name}: loadSetup: no setup`);
            this.setup = new Setup();
        }
        return this.setup;
    }

    private storeSetup(): void {
        const setupString = JSON.stringify(this.setup);
        console.log(`${this.constructor.name}.storeSetup: ${setupString}`, this.setup);

        localStorage.setItem(Renderer.SETUP_KEY, setupString);
    }


    private static getConfigKey(browserId: number): string {
        return `browser-${browserId}-config`;
    }

    protected defaultConfig: Config = DefaultConfig;

    private loadAllConfig(): void {
        console.log(`${this.constructor.name}: loadAllConfig`);

        if (!this.setup) throw new Error(`${this.constructor.name}.loadAllConfig(): no setup`);

        for (const display of this.setup.displays) {
            for (const browser of display.browsers) {
                this.loadConfig(browser.id);
            }
        }
        this.loadedAllConfig = true;
    }

    protected loadConfig(browserId: number): Config {
        try {
            let config: Config;

            if (browserId in this.configs) {
                config = this.configs[browserId];
            } else {
                const configString = localStorage.getItem(Renderer.getConfigKey(browserId));
                if (null == configString) {
                    config = cloneDeep(this.defaultConfig);
                } else {
                    config = JSON.parse(configString);
                }
                this.configs[browserId] = config;
                if (null == configString) {
                    this.storeConfig(browserId, JSON.stringify(config));
                }
            }
            return config;
        } catch (loadConfigError) {
            console.error(`${this.constructor.name}: loadConfig[${browserId}]: ${loadConfigError}: `, loadConfigError);
            throw new Error(`${this.constructor.name}: loadConfig[${browserId}]: ${loadConfigError}: `);
        }
    }

    private storeConfig(browserId: number, config: string | null): void {
        localStorage.setItem(Renderer.getConfigKey(browserId), config ? config : '');
    }
}

declare global {
    interface Window {
        wallpaper: {
            register: (listeners: { user: (settings: Properties) => void }) => void;
        };
    }
}

type Size = { width: number; height: number };
type UserCallback = (settings: Properties) => void;
type SizeCallback = (size: Size) => void;
type Listeners = { user?: UserCallback; size?: SizeCallback };

/**
 * Renderer Config Controller for Wallpaper Browsers. Deal with size
 */
class Paper extends Renderer {
    private displayWidth: number;
    private displayHeight: number;
    private browserId: number;
    private paper: Listeners = {};

    constructor() {
        super();

        const displayWidth = process.argv.find((arg) => /^--displaywidth=/.test(arg));
        const displayHeight = process.argv.find((arg) => /^--displayheight=/.test(arg));
        const browserId = process.argv.find((arg) => /^--browserid=/.test(arg));

        if (!(displayWidth && displayHeight && browserId)) {
            console.error(`${this.constructor.name}() missing arguments: displayWidth=${displayWidth} displayHeight=${displayHeight} browserId=${browserId}`, process.argv);
            throw new Error(`${this.constructor.name}() missing arguments: displayWidth=${displayWidth} displayHeight=${displayHeight} browserId=${browserId}`);
        }

        this.displayWidth = Number(displayWidth.split('=')[1]);
        this.displayHeight = Number(displayHeight.split('=')[1]);
        this.browserId = Number(browserId.split('=')[1]);

        this.connectToWallpaper();
    }


    private onRegisterPaper = (listeners: Listeners): void => {
        this.paper = listeners;

        console.log(`ConfigController: ${this.browserId}: register`, listeners);

        this.initUserListener();

        this.initSizeListener();
    }

    private initUserListener(): void {
        if (this.paper.user) {
            const setting = this.loadConfig(this.browserId);

            try {
                this.paper.user(setting.general.properties);
            } catch (initialError) {
                console.error(
                    `${this.constructor.name}: ${this.browserId}: ERROR initial user setting:${initialError}:`,
                    initialError,
                    setting.general);
            }
        }
    }

    private initSizeListener(): void {
        if (this.paper.size) {
            const size: Size = { width: this.displayWidth, height: this.displayHeight };

            try {
                this.paper.size(size);
            } catch (initialError) {
                console.error(
                    `ConfigController: ${JSON.stringify(size)}: ERROR initial size setting:${initialError}:`,
                    initialError,
                    size);
            }
        }
    }

    /**
     * Exposes interface to wallpaper window, e.g. window.wallpaper.register(listeners)
     */
    private connectToWallpaper(): void {
        // Expose protected methods that allow the renderer process to use
        // the ipcRenderer without exposing the entire object
        window.wallpaper = {
            register: this.onRegisterPaper
        };
    }

}

class Main extends ControllerImpl {
    protected getAllWindows = BrowserWindow.getAllWindows;

    private ipc: IpcMain = electronIpcMain;
    private updating = false;
    private updates: SetupDiff[] = [];

    constructor() {
        super();

        this.ipc.once('init', this.onInitialSetup);
        this.ipc.on('change', this.onSetupChanged);
    }

    onInitialSetup = (e, setup: SetupInterface): void => {
        this.setup = new Setup(setup);

        console.log(`${this.constructor.name}.onInitialSetup: ${this.setup}`);

        this.updating = true;
        try {
            this.emit('init', this.setup);
        } finally {
            this.updating = false;
            this.processUpdateQueue();
        }
    }

    processUpdateQueue(): void {
        if ((!this.updating) && this.updates.length) {
            this.updating = true;
            try {
                do {
                    const update = this.updates[0];
                    this.updates.shift();

                    this.deliverUpdate(update);

                } while (this.updates.length);
            } finally {
                this.updating = false;
            }
        }
    }

    getSetup(includeConfig: boolean): Promise<Setup> {
        throw new Error(`Main.getSetup(${includeConfig}): Use events instead: init, change`);
    }

    updateSetup(update: SetupDiff): void {
        console.log(`${this.constructor.name}.updateSetup: ${this.updating} no promise, emit `, update);

        this.updates.push(update);
        this.processUpdateQueue();
    }

    deliverUpdate(update: SetupDiff): void {

        this.updating = true;
        try {
            this.processSetupChange(update);
            this.emit('change', update);

            this.updateAllWindows(update, true);
        } finally {
            this.updating = false;
        }
    }

    onSetupChanged = (e, update: SetupDiffInterface): void => {
        const updateObj = new SetupDiff(update);

        this.processSetupChange(updateObj);
        this.emit('change', updateObj);
    }
}


/**
 * Instance for this context
 */
let controller: Controller;

/**
 * Config controller factory
 */
switch (process.type) {
    case 'browser':
        console.log(`Config.Controller[${process.type}]: create Main`);
        controller = new Main();
        break;
    case 'renderer':
        if (process.argv.some((arg) => /^--browserid=/.test(arg))) {
            console.log(`Config.Controller[${process.type}]: create Paper`);
            controller = new Paper();
        } else {
            console.log(`Config.Controller[${process.type}]: create Renderer`);
            controller = new Renderer();
        }
        break;
    case 'worker':
    default:
        console.error(`Config.Controller[${process.type}]: is not supported`);
        throw new Error(
            `Config.Controller: process.type=${process.type} is not supported`
        );
}

export default controller;

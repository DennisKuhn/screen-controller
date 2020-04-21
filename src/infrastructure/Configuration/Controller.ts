import fs from 'fs';
import { EventEmitter } from 'events';
import electron, { IpcRendererEvent, IpcMainEvent, BrowserWindow, ipcMain as electronIpcMain, ipcRenderer as electronIpcRenderer } from 'electron';
import { Setup, SetupDiff, Browser, Config, SetupInterface, SetupDiffInterface } from './WallpaperSetup';
import { fs2URL } from '../../utils/Url';
import { cloneDeep, mergeWith, omit } from 'lodash';

import '../../wallpaper/project.json';

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
    protected loadedConfig = false;

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
        mergeWith(
            this.setup,
            update,
            (objValue, srcValue, key, object /*, source, stack */) => {
                if (key == 'paper') {
                    if ('config' in srcValue) {
                        console.log(`${this.constructor.name}.processSetupChange: split config[${object.id}]: ${srcValue.config}`);
                        this.configs[object.id] = srcValue.config;
                        return omit(srcValue, 'config');
                    }
                    return srcValue;
                } // else mergeWith handles it
            });
        console.log(`${this.constructor.name}.processedSetupChange() ${JSON.stringify(update)} => ${JSON.stringify(this.setup)} + ${JSON.stringify(this.configs)}`);
    }

    protected updateAllWindows(update: SetupDiff, persist?: boolean): void {
        console.log(`${this.constructor.name}.updateAllWindows: ${update}`);

        for (const window of BrowserWindow.getAllWindows()) {
            const ipcWindow = window.webContents as IpcWindow;

            console.log(`${this.constructor.name}.onSetupChanged: send to ${window.id}.${window.getBrowserView()?.id} persist=${persist}`);
            
            ipcWindow.send('change', update, persist);

            persist = undefined;
        }
    }


    abstract getSetup(includeConfig: boolean): Promise<Setup>;

    abstract updateSetup(update: SetupDiff): void;
}



class Renderer extends ControllerImpl {
    private static SETUP_KEY = 'Setup';

    private ipc: IpcRenderer = electronIpcRenderer;

    constructor() {
        super();

        console.log(`${this.constructor.name}()`);

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

        if (!this.loadedConfig) {
            await this.loadConfig();
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


    private static getConfigKey(browser: Browser): string {
        return `${browser.id}`;
    }

    protected defaultConfig: Config | undefined;

    private async loadConfig(): Promise<void> {
        console.log(`${this.constructor.name}: loadConfig`);

        if (!this.setup) throw new Error(`${this.constructor.name}.loadConfig(): no setup`);

        for (const display of this.setup.displays) {
            for (const browser of display.browsers) {
                try {
                    let configString = localStorage.getItem(Renderer.getConfigKey(browser));
                    const isDefault = configString == null;
                    let config: Config;

                    if (isDefault && this.defaultConfig) {
                        config = cloneDeep(this.defaultConfig);
                    } else {
                        if (null == configString) {
                            configString = await this.loadDefault();
                        }
                        config = JSON.parse(configString);
                    }

                    this.configs[browser.id] = config;

                    if (isDefault) {
                        this.defaultConfig = this.defaultConfig ?? cloneDeep(config);
                        this.storeConfig(browser, configString ?? JSON.stringify(config));
                    }
                } catch (loadConfigError) {
                    console.error(
                        `${this.constructor.name}: loadConfig[${browser.id}]: ${loadConfigError}: `,
                        loadConfigError);
                }
            }
        }
        this.loadedConfig = true;
    }

    private storeConfig(browser: Browser, config: string | null): void {
        localStorage.setItem(Renderer.getConfigKey(browser), config ? config : '');
    }


    async loadDefault(): Promise<string> {
        const defaultPath = fs2URL('../../wallpaper/project.json'); // href2fs(defaultLocation);

        console.log(`${this.constructor.name}.loadDefault: path: ${defaultPath}`);
        try {
            const buffer = await fs.promises.readFile(defaultPath);
            console.log(`${this.constructor.name}.loadEDdefault`, buffer.toString());

            return buffer.toString();
        } catch (loadError) {
            console.error(
                `${this.constructor.name}: ERROR loading default:${loadError}:${defaultPath}`,
                loadError,
                defaultPath);
            throw new Error(`${this.constructor.name}: ERROR loading default:${loadError}:${defaultPath}`);
        }
    }
}

/**
 * Renderer Config Controller for Wallpaper Browsers. Deal with size
 */
class Paper extends Renderer {
    private displayWidth: number;
    private displayHeight: number;
    private browserId: number;

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
    }
}

class Main extends ControllerImpl {

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
        console.log(`${this.constructor.name}.onSetupChanged: ${this.updating} no promise, emit `, update);

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

    onSetupChanged(e, update: SetupDiffInterface): void {
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

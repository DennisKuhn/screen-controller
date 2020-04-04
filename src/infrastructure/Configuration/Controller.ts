import crypto from 'crypto';
import fs from 'fs';
import { EventEmitter } from 'events';
import { ipcMain, ipcRenderer } from 'electron';
import { Setup, Browser, Display, Config } from './WallpaperSetup';
import Url, { href2fs } from '../../utils/Url';
import _ from 'lodash';

interface BrowserConfig {
    [key: number]: Config;
}

/**
 * @emits 'change'
 */
export class Controller extends EventEmitter {
    public static setupChanged = Symbol('setupChanged');

    protected static GET_SETUP = 'getSetup';
    protected static WAIT_FOR_SETUP = 'waitForSetup';
    protected static SETUP_CHANGED = 'setupChanged';

    protected setup: Setup = { displays: [] };
    protected configs: BrowserConfig = {};
    protected loadedConfig = false;

    protected constructor() {
        super();
        console.log(`Config.Controller.contructor: ${this.constructor.name}`);
    }

    log(): void {
        console.log(`${this.constructor.name}`);
    }

    getSetup(includeConfig: boolean): Promise<Setup> {
        throw Error(`Controller.getSetup(${includeConfig}) must be implemented by ${this.constructor.name}`);
    }

    updateSetup(update: Partial<Setup>): void {
        throw Error(`Controller.updateSetup(${update}) must be implemented by ${this.constructor.name}`);
    }

    protected get fullSetup(): Setup {
        const fullSetup: Setup = _.cloneDeep(this.setup);

        Object.values(fullSetup.displays).forEach(
            (display: Display) => Object.values(display.browsers).forEach(
                (browser: Browser) => {
                    if (browser.id in this.configs) {
                        browser.paper.config = this.configs[browser.id];
                    }
                }
            )
        );

        return fullSetup;
    }
}

class Renderer extends Controller {
    private static SETUP_KEY = 'Setup';

    constructor() {
        super();

        if (ipcRenderer.listenerCount(Controller.GET_SETUP) == 0) {
            ipcRenderer.on(Controller.GET_SETUP, this.onGetSetup);
        }

        this.loadSetup();

        if (ipcRenderer.listenerCount(Controller.WAIT_FOR_SETUP) > 0) {
            ipcRenderer.send(Controller.WAIT_FOR_SETUP, this.setup);
        }

        ipcRenderer.on(Controller.SETUP_CHANGED, this.onSetupChanged);
    }

    updateSetup(update: Partial<Setup>): void {
        ipcRenderer.send(Controller.SETUP_CHANGED, update);

        this.processSetupChange(update);

        this.storeSetup();
    }

    onSetupChanged(e, update: Partial<Setup>): void {
        this.processSetupChange(update);
    }

    processSetupChange(update: Partial<Setup>): void {

        console.log(`${this.constructor.name}.processSetupChange() ${JSON.stringify(update)} => ${JSON.stringify(this.setup)} + ${JSON.stringify(this.configs)}`);
        _.mergeWith(
            this.setup,
            update,
            (objValue, srcValue, key, object /*, source, stack */) => {
                if (key == 'paper') {
                    if ('config' in srcValue) {
                        console.log(`${this.constructor.name}.processSetupChange: split config[${object.id}]: ${srcValue.config}`);
                        this.configs[object.id] = srcValue.config;
                        return _.omit(srcValue, 'config');
                    }
                    return srcValue;
                } // else mergeWith handles it
            });
        console.log(`${this.constructor.name}.processedSetupChange() ${JSON.stringify(update)} => ${JSON.stringify(this.setup)} + ${JSON.stringify(this.configs)}`);
    }

    async onGetSetup(e, responseChannel: string, includeConfig: boolean): Promise<void> {

        ipcRenderer.send(
            responseChannel,
            await this.getSetup(includeConfig)
        );
    }

    async getSetup(includeConfig: boolean): Promise<Setup> {
        let response: Setup;

        if (includeConfig) {
            if (!this.loadedConfig) {
                await this.loadConfig();
            }
            response = this.setup;
        } else {
            response = this.fullSetup;
        }

        return response;
    }

    private loadSetup(): void {
        console.log(`${this.constructor.name}: loadSetup`);
        const setupString = localStorage.getItem(Renderer.SETUP_KEY);

        if (setupString) {
            this.setup = JSON.parse(setupString);
        } else {
            console.warn(`${this.constructor.name}: loadSetup: no setup`);
            this.setup = { displays: [] };
        }
    }

    private storeSetup(): void {
        const setupString = JSON.stringify(this.setup);
        console.log(`${this.constructor.name}.storeSetup: ${setupString}`, this.setup);
        
        localStorage.setItem(Renderer.SETUP_KEY, setupString);
    }


    private static getFileId(fileUrl: Url): string {
        return crypto.createHash('md5').update(fileUrl.href).digest('hex');
    }

    private static getConfigKey(browser: Browser): string {
        const fileId = Renderer.getFileId(browser.paper.file);

        return `${browser.id}-${fileId}`;
    }

    private async loadConfig(): Promise<void> {
        console.log(`${this.constructor.name}: loadConfig`);

        // Create a promise for each browser in each display, because loadDefault might load a file
        // All configs are loaded "parallel"
        const promises = Object.values(this.setup.displays).flatMap(
            (display: Display): Promise<void>[] => Object.values(display.browsers).map(
                async browser => {
                    try {
                        let configString = localStorage.getItem(Renderer.getConfigKey(browser));

                        if (null == configString) {
                            configString = await this.loadDefault(browser);

                            this.storeConfig(browser, configString);
                        }
                        if (configString && configString.length) {
                            this.configs[browser.id] = JSON.parse(configString);
                        } else {
                            console.warn(`${this.constructor.name}.loadConfig: ${browser.id}: no config: ${browser.paper.file.href}`);
                        }
                    } catch (loadConfigError) {
                        console.error(
                            `${this.constructor.name}: loadConfig[${browser.id}]: ${loadConfigError}: `,
                            loadConfigError);
                    }
                })
        );

        await Promise.all(promises);
        this.loadedConfig = true;
    }

    private storeConfig(browser: Browser, config: string | null): void {
        localStorage.setItem(Renderer.getConfigKey(browser), config ? config : '');
    }

    async loadDefault(browser: Browser): Promise<string | null> {
        const defaultLocation = browser.paper.file.href.substring(0, browser.paper.file.href.lastIndexOf('/') + 1) + 'project.json';
        const defaultPath = href2fs(defaultLocation);

        console.log(
            `${this.constructor.name}[${browser.id}].loadDefault: ${Renderer.getConfigKey(browser)}: path: ${defaultPath} file: ${browser.paper.file.href}`);
        try {
            const buffer = await fs.promises.readFile(defaultPath);
            console.log(`${this.constructor.name}[${browser.id}].loadEDdefault`, buffer.toString());

            return buffer.toString();
        } catch (loadError) {
            console.error(
                `${this.constructor.name}: ${browser.id}: ERROR loading default:${loadError}:${defaultLocation}`,
                loadError,
                defaultLocation);
        }
        return null;
    }
}

type SetupPromise = {
    resolve: (setup: Setup) => void;
    reject: (reason: string) => void;
};

class Main extends Controller {

    setupPromises: SetupPromise[] = [];

    constructor() {
        super();

        ipcMain.on(Controller.SETUP_CHANGED, this.onSetupChanged);
    }

    onInitialSetup = (e, setup: Setup): void => {
        this.setup = setup;

        console.log(`${this.constructor.name}.onInitialSetup: promises=${this.setupPromises.length}`);

        this.setupPromises.forEach(
            promise => promise.resolve(this.setup)
        );
        this.setupPromises.length = 0;
    }

    getSetup(includeConfig: boolean): Promise<Setup> {
        return new Promise<Setup>(
            (resolve, reject) => {
                if (this.setup) {
                    resolve(this.setup);
                } else {
                    this.setupPromises.push({ resolve: resolve, reject: reject });

                    if (ipcMain.listenerCount(Main.GET_SETUP)) {
                        const id = crypto.randomBytes(2).toString();
                        ipcMain.once(id, this.onInitialSetup);
                        Electron.BrowserWindow.getAllWindows().forEach(
                            window => window.webContents.send(
                                Controller.GET_SETUP, id, includeConfig
                            )
                        );
                    } else {
                        ipcMain.once(Controller.WAIT_FOR_SETUP, this.onInitialSetup);
                    }

                }
            });
    }

    updateSetup(update: Partial<Setup>): void {
        this.onSetupChanged(null, update);
    }

    onSetupChanged(e, update: Partial<Setup>): void {
        Electron.BrowserWindow.getAllWindows().forEach(
            window => window.webContents.send(
                Controller.SETUP_CHANGED, update
            )
        );
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
        console.log(`Config.Controller[${process.type}]: create Renderer`);
        controller = new Renderer();
        break;
    case 'worker':
    default:
        console.error(`Config.Controller[${process.type}]: is not supported`);
        throw new Error(
            `Config.Controller: process.type=${process.type} is not supported`
        );
}

export default controller;

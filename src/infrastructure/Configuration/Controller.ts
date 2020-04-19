import crypto from 'crypto';
import fs from 'fs';
import { EventEmitter } from 'events';
import { BrowserWindow, ipcMain, ipcRenderer } from 'electron';
import { Setup, SetupDiff, Browser, Config } from './WallpaperSetup';
import Url, { fs2URL } from '../../utils/Url';
import _ from 'lodash';

import '../../wallpaper/project.json';

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

    protected setup: Setup|undefined;
    protected configs: BrowserConfig = {};
    protected loadedConfig = false;

    protected constructor() {
        super();
        console.log(`Config.Controller.contructor: ${this.constructor.name}`);
    }

    log(): void {
        console.log(`${this.constructor.name}.log()`);
    }

    getSetup(includeConfig: boolean): Promise<Setup> {
        throw Error(`Controller.getSetup(${includeConfig}) must be implemented by ${this.constructor.name}`);
    }

    updateSetup(update: SetupDiff): void {
        throw Error(`Controller.updateSetup(${update}) must be implemented by ${this.constructor.name}`);
    }

    protected get fullSetup(): Setup {
        if (!this.setup) throw new Error(`${this.constructor.name}.get fullSetup: no setup`);

        const fullSetup: Setup = _.cloneDeep(this.setup);

        for (const display of fullSetup.displays) {
            for (const browser of display.browsers) {
                if (browser.id in this.configs) {
                    browser.config = this.configs[browser.id];
                }
            }
        }

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

        console.log(`${this.constructor.name}() GET_SETUP=${ipcRenderer.listenerCount(Controller.GET_SETUP)}  WAIT_FOR_SETUP=${ipcRenderer.listenerCount(Controller.WAIT_FOR_SETUP)}`);
        if (ipcRenderer.listenerCount(Controller.WAIT_FOR_SETUP) > 0) {
            ipcRenderer.send(Controller.WAIT_FOR_SETUP, this.setup);
        }

        ipcRenderer.on(Controller.SETUP_CHANGED, this.onSetupChanged);
    }

    updateSetup(update: SetupDiff): void {
        ipcRenderer.send(Controller.SETUP_CHANGED, update);

        this.processSetupChange(update);

        this.storeSetup();
    }

    onSetupChanged(e, update: SetupDiff): void {
        this.processSetupChange(update);
    }

    processSetupChange(update: SetupDiff): void {

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

    private loadSetup(): void {
        console.log(`${this.constructor.name}: loadSetup`);
        const setupString = localStorage.getItem(Renderer.SETUP_KEY);

        if (setupString) {
            this.setup = JSON.parse(setupString);
        } else {
            console.warn(`${this.constructor.name}: loadSetup: no setup`);
            this.setup = new Setup();
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
                        config = _.cloneDeep(this.defaultConfig);
                    } else {
                        if (null == configString) {
                            configString = await this.loadDefault();
                        }
                        config = JSON.parse(configString);
                    }
                    
                    this.configs[browser.id] = config;

                    if (isDefault) {
                        this.defaultConfig = this.defaultConfig ?? _.cloneDeep( config );
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

        console.log( `${this.constructor.name}.loadDefault: path: ${defaultPath}` );
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
            promise => promise.resolve(setup)
        );
        this.setupPromises.length = 0;
    }

    getSetup(includeConfig: boolean): Promise<Setup> {
        return new Promise<Setup>(
            (resolve, reject) => {
                if (this.setup) {
                    console.log(`${this.constructor.name}.getSetup: resolve, still promises=${this.setupPromises.length}`);
                    resolve(this.setup);
                } else {
                    this.setupPromises.push({ resolve: resolve, reject: reject });

                    if (ipcMain.listenerCount(Main.GET_SETUP)) {
                        console.log(`${this.constructor.name}.getSetup: request, GET_SETUP=${ipcMain.listenerCount(Main.GET_SETUP)}`);
                        const id = crypto.randomBytes(2).toString();
                        ipcMain.once(id, this.onInitialSetup);
                        Electron.BrowserWindow.getAllWindows().forEach(
                            window => window.webContents.send(
                                Controller.GET_SETUP, id, includeConfig
                            )
                        );
                    } else {
                        console.log(`${this.constructor.name}.getSetup: wait`);
                        ipcMain.once(Controller.WAIT_FOR_SETUP, this.onInitialSetup);
                    }

                }
            });
    }

    updateSetup(update: SetupDiff): void {
        this.onSetupChanged(null, update);
    }

    onSetupChanged(e, update: SetupDiff): void {
        BrowserWindow.getAllWindows().forEach(
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

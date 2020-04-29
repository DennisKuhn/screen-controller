import { IMapDidChange, reaction, autorun, observable } from 'mobx';
import { EventEmitter } from 'events';
import electron, { IpcRendererEvent, IpcMainEvent, BrowserWindow, ipcMain as electronIpcMain, ipcRenderer as electronIpcRenderer, remote } from 'electron';
import { Setup, Config, Properties, Display, Browser, SetupInterface, BrowserInterface, DisplayInterface } from './WallpaperSetup';
import { cloneDeep, isEqual } from 'lodash';

import DefaultConfig from '../../wallpaper/project.json';

interface BrowserConfig {
    [key: number]: Config;
}

type InitChannel = 'init';
type ChangeChannel = 'change';

interface IpcRenderer extends electron.IpcRenderer {
    send(channel: InitChannel, setup: SetupInterface): void;

    send(channel: ChangeChannel, args: IpcChangeArgs): void;
    // send(channel: ChangeChannel, args: IpcAddBrowserArgs): void;
    // send(channel: ChangeChannel, args: IpcAddDisplayArgs): void;
    // send(channel: ChangeChannel, args: IpcDeleteArgs): void;
    // send(channel: ChangeChannel, args: IpcUpdateBrowserArgs): void;

    /// From IpcWindow.send
    on(channel: ChangeChannel, listener: (event: IpcRendererEvent, args: IpcChangeArgs, persist?: boolean) => void): this;
}

interface IpcMain extends electron.IpcMain {
    once(channel: InitChannel, listener: (event: IpcMainEvent, setup: SetupInterface) => void): this;

    on(channel: ChangeChannel, listener: (event: IpcMainEvent, args: IpcChangeArgs) => void): this;
}

interface IpcWindow extends electron.WebContents {
    // send(channel: ChangeChannel, args: IpcAddBrowserArgs, persist?: boolean): void;
    // send(channel: ChangeChannel, args: IpcAddDisplayArgs, persist?: boolean): void;
    // send(channel: ChangeChannel, args: IpcDeleteArgs, persist?: boolean): void;
    // send(channel: ChangeChannel, args: IpcUpdateBrowserArgs, persist?: boolean): void;
    send(channel: ChangeChannel, args: IpcChangeArgs, persist?: boolean): void;
}

type ChangeType = 'add' | 'delete' | 'update';
type ChangeComponent = 'displays' | 'browsers' | 'browser';

interface IpcChangeArgs {
    type: ChangeType;
    component: ChangeComponent;
}

interface IpcAddDisplayArgs extends IpcChangeArgs {
    type: 'add';
    component: 'displays';

    id: string;
    display: DisplayInterface;
}

interface IpcAddBrowserArgs extends IpcChangeArgs {
    type: 'add';
    component: 'browsers';

    displayId: string;
    id: string;
    browser: BrowserInterface;
}

interface IpcUpdateBrowserArgs extends IpcChangeArgs {
    type: 'update';
    component: 'browser';

    browser: BrowserInterface;
}

interface IpcDeleteArgs extends IpcChangeArgs {
    type: 'delete';
    component: 'displays' | 'browsers';

    id: string;
}


type InitialSetupEvent = 'init';

type SetupListener = (setup: Setup) => void;


export declare interface Controller {
    on(event: InitialSetupEvent, listener: SetupListener): this;

    once(event: InitialSetupEvent, listener: SetupListener): this;

    getSetup(includeConfig: boolean): Promise<Setup>;

    log(): void;
}

declare interface ControllerImpl {
    emit(event: InitialSetupEvent, setup: Setup): boolean;

    // send(type: ChangeType, component: ChangeComponent, args: IpcChangeArgs): void;
    send(args: IpcAddBrowserArgs): void;
    send(args: IpcAddDisplayArgs): void;
    send(args: IpcDeleteArgs): void;
    send(args: IpcUpdateBrowserArgs): void;
}

/**
 */
abstract class ControllerImpl extends EventEmitter implements Controller {
    protected setup: Setup;
    protected configs: BrowserConfig;
    protected loadedAllConfig = false;
    protected abstract getAllWindows: () => Electron.BrowserWindow[];
    protected abstract getWindowById: (id: number) => Electron.BrowserWindow;

    protected constructor() {
        super();
        // console.log(`Config.ControllerImpl(${this.constructor.name})`);
        this.setup = new Setup();
        this.configs = {};
    }

    initObservers = (): void => {
        // debugger;
        // reaction(
        //     this.setup.getPlainSetup,
        //     this.persist,
        //     { name: this.constructor.name + ' persist change', delay: 1000 }
        // );
        this.setup.displays.observe(
            this.onLocalDisplaysChange,
            false
        );
    }

    protected onLocalDisplaysChange = (changes: IMapDidChange<string, Display>): void => {
        //console.log(`${this.constructor.name}.onLocalDisplaysChange(${changes.type}): `, changes);

        switch (changes.type) {
            case 'add':
                console.log(`${this.constructor.name}.onLocalDisplaysChange(${changes.type}): ${changes.newValue.id}`);
                this.send({ type: 'add', component: 'displays', id: changes.newValue.id, display: changes.newValue.plain });
                break;
            case 'delete':
                console.log(`${this.constructor.name}.onLocalDisplaysChange(${changes.type}): ${changes.oldValue.id}`);
                this.send({ type: 'delete', component: 'displays', id: changes.oldValue.id });
                break;
            case 'update':
            default:
                console.error(`${this.constructor.name}.onLocalDisplaysChange(${changes}): invalid changes.type: ${changes.type} - should be 'add' or 'delete'`);
            // throw new Error(`${this.constructor.name}.onLocalDisplaysChange(${changes}): invalid changes.type: ${changes.type} - should be 'add' or 'delete'`);
        }
    }

    protected onLocalBrowsersChange = (changes: IMapDidChange<string, Browser>): void => {
        // console.log(`${this.constructor.name}.onLocalBrowsersChange(${changes.type})`);

        switch (changes.type) {
            case 'add':
                {
                    console.log(`${this.constructor.name}.onLocalBrowsersChange(${changes.type}): ${changes.newValue.id}`);
                    reaction(
                        () => changes.newValue.plain,
                        this.onLocalBrowserChange,
                        { name: this.constructor.name + '.onLocalBrowsersChange browser change', delay: 1 }
                    );

                    let displayId: string | undefined;

                    for (const display of this.setup.displays.values()) {
                        if (display.browsers.has(changes.newValue.id)) {
                            displayId = display.id;
                            break;
                        }
                    }
                    if (!displayId) throw new Error(`${this.constructor.name}.onLocalBrowsersChange(${changes.type}) no display for browser id ${changes.newValue.id} `);

                    this.send({ type: 'add', component: 'browsers', displayId: displayId, id: changes.newValue.id, browser: changes.newValue.plain } );

                }
                break;
            case 'delete':
                console.log(`${this.constructor.name}.onLocalBrowsersChange(${changes.type}): ${changes.oldValue.id}`);
                this.send({ type: 'delete', component: 'browsers', id: changes.oldValue.id });
                break;
            case 'update':
            default:
                console.error(`${this.constructor.name}.onLocalBrowsersChange(${changes}): invalid changes.type: ${changes.type} - should be 'add' or 'delete'`);
            // throw new Error(`${this.constructor.name}.onLocalBrowsersChange(${changes}): invalid changes.type: ${changes.type} - should be 'add' or 'delete'`);
        }
    }

    protected onLocalBrowserChange = (browser: BrowserInterface /*, r */): void => {
        console.log(`${this.constructor.name}.onLocalBrowserChange(${browser.id})`);

        this.send({ type: 'update', component: 'browser', browser: browser });
    }

    protected shouldSendChange = (change: IpcChangeArgs): boolean => {
        const i = this.receivedChanges.findIndex(
            received => isEqual(change, received)
        );
        if (i > -1) {
            console.log(`${this.constructor.name}.shouldSendChange: found @${i} don't send: ${change.type} - ${change.component}`);
            this.receivedChanges.splice(i, 1);

            return false;
        }
        console.log(`${this.constructor.name}.shouldSendChange: send ${change.type} - ${change.component}`);
        this.persist(this.setup.plain);
        return true;
    }

    // abstract send(type: ChangeType, component: ChangeComponent, args: IpcChangeArgs): void;


    log(): void {
        console.log(`${this.constructor.name}.log()`);
    }

    protected get fullSetup(): Setup {
        // this.setup = this.init();
        const fullSetup: Setup = cloneDeep(this.setup);

        for (const display of fullSetup.displays.values()) {
            for (const [browserId, browser] of display.browsers) {
                if (browserId in this.configs) {
                    browser.config = this.configs[browserId];
                }
            }
        }

        return fullSetup;
    }

    protected updateAllWindows(args: IpcChangeArgs, senderId: number, persist?: boolean): void {
        // console.log(`${this.constructor.name}.updateAllWindows: ${update}`);

        for (const window of this.getAllWindows()) {

            if (window.id != senderId) {
                const ipcWindow = window.webContents as IpcWindow;
                const started = window.eventNames().indexOf('ready-to-show') < 0;

                // If a window was just closed, checks like:
                // window.isDestroyed(), doubleCheck = this.getWindowById(window.id), ipcWindow.isDestroyed()
                // didn't help to avoid throwing:
                // Uncaught(in promise) TypeError: Object has been destroyed
                // at electron / js2c / browser_init.js: 6754
                // at IpcMainImpl.<anonymous>(electron / js2c / browser_init.js: 6597)
                // at IpcMainImpl.emit(events.js: 210)
                // at WebContents.<anonymous>(electron / js2c / browser_init.js: 3873)
                // at WebContents.emit(events.js: 210)

                if (started) {
                    console.log(`${this.constructor.name}.updateAllWindows(${senderId}): send to ${window.id}, ${persist}`);
                    ipcWindow.send('change', args, persist);
                    persist = undefined;
                } else {
                    console.warn(`${this.constructor.name}.updateAllWindows(${senderId}, ${persist}): skipping ${window.id} started=${started}`);
                }
            }
        }
    }

    protected setupFromPlain(plainSetup: SetupInterface): void {
        console.log(`${this.constructor.name}.setupFromPlain:`, plainSetup);
        this.setup.fromPlain(plainSetup, this.onLocalBrowsersChange, this.onLocalBrowserChange);
        this.initObservers();
    }


    abstract getSetup(includeConfig: boolean): Promise<Setup>;

    protected persist = (plainSetup): void => {
        // console.log(`${this.constructor.name}.persist not implemented`, plainSetup);
    }

    receivedChanges: IpcChangeArgs[] = new Array<IpcChangeArgs>();

    protected processSetupChange(args: IpcChangeArgs): void {
        this.receivedChanges.push(args);

        switch (args.component) {
            case 'browser':
                if (args.type == 'update') {
                    const update = args as IpcUpdateBrowserArgs;

                    for (const display of this.setup.displays.values()) {
                        for (const browser of display.browsers.values()) {
                            if (browser.id == update.browser.id) {
                                console.log(
                                    `${this.constructor.name}.processSetupChange: ${args.component} - ${args.type}: ${update.browser.id} @${display.id}:`,
                                    { ...update.browser });

                                browser.update(update.browser);
                                return;
                            }
                        }
                    }
                    console.error(`${this.constructor.name}.processSetupChange: ${args.component} - ${args.type} - can't find: ${update.browser.id}`);
                    // throw new Error(`${this.constructor.name}.processSetupChange: ${args.component} - ${args.type} - can't find: ${update.browser.id}`);
                } else
                    console.error(`${this.constructor.name}.processSetupChange: ${args.component} - incorrect type: ${args.type}`);
                // throw new Error(`${this.constructor.name}.processSetupChange: ${args.component} - incorrect type: ${args.type}`);
                break;
            case 'browsers':
                if (args.type == 'add') {
                    const addition = args as IpcAddBrowserArgs;

                    for (const display of this.setup.displays.values()) {
                        if (display.id == addition.displayId) {
                            console.log(
                                `${this.constructor.name}.processSetupChange: ${args.component} - ${args.type}: ${addition.browser.id} @${display.id}:`,
                                { ...addition.browser });
                            const newBrowser = observable(new Browser(addition.browser));
                            display.browsers.set(addition.browser.id, newBrowser);
                            reaction(
                                () => newBrowser.plain,
                                this.onLocalBrowserChange,
                                { name: this.constructor.name + '.processSetupChange browser change', delay: 1 }
                            );
                            return;
                        }
                    }
                    console.error(`${this.constructor.name}.processSetupChange: ${args.component} - ${args.type} - ${addition.browser.id} - can't find: ${addition.displayId}`);
                    //throw new Error(`${this.constructor.name}.processSetupChange: ${args.component} - ${args.type} - ${addition.browser.id} - can't find: ${addition.displayId}`);
                } else if (args.type == 'delete') {
                    const id = (args as IpcDeleteArgs).id;

                    for (const display of this.setup.displays.values()) {
                        if (display.browsers.has(id)) {
                            console.log(`${this.constructor.name}.processSetupChange: ${args.component} - ${args.type}: ${id} @${display.id}`);
                            display.browsers.delete(id);
                            return;
                        }
                    }
                    console.error(`${this.constructor.name}.processSetupChange: ${args.component} - ${args.type} - can't find: ${id}`);
                    // throw new Error(`${this.constructor.name}.processSetupChange: ${args.component} - ${args.type} - can't find: ${id}`);
                } else
                    console.error(`${this.constructor.name}.processSetupChange: ${args.component} - incorrect type: ${args.type}`);
                // throw new Error(`${this.constructor.name}.processSetupChange: ${args.component} - incorrect type: ${args.type}`);
                break;
            case 'displays':
                if (args.type == 'add') {
                    const addition = args as IpcAddDisplayArgs;
                    console.log(`${this.constructor.name}.processSetupChange: ${args.component} - ${args.type}: ${addition.id}`);
                    this.setup.displays.set(
                        addition.id,
                        new Display(addition.id, this.onLocalBrowsersChange));
                } else if (args.type == 'delete') {
                    this.setup.displays.delete((args as IpcDeleteArgs).id);
                } else
                    console.error(`${this.constructor.name}.processSetupChange: ${args.component} - incorrect type: ${args.type}`);
                // throw new Error(`${this.constructor.name}.processSetupChange: ${args.component} - incorrect type: ${args.type}`);
                break;
            default:
                console.error(`${this.constructor.name}.processSetupChange: incorrect component: ${args.component}`);
            // throw new Error(`${this.constructor.name}.processSetupChange: incorrect component: ${args.component}`);
        }
    }
}



class Renderer extends ControllerImpl {
    protected getAllWindows = electron.remote.BrowserWindow.getAllWindows;
    protected getWindowById = electron.remote.BrowserWindow.fromId;

    private static SETUP_KEY = 'Setup';

    private ipc: IpcRenderer = electronIpcRenderer;

    private windowId;

    constructor() {
        super();

        this.windowId = remote.getCurrentWindow().id;

        console.log(`${this.constructor.name}() ${this.windowId}`);

        this.setup = this.loadSetup();

        this.ipc.send('init', this.setup.plain);

        this.ipc.on('change', this.onSetupChanged);
    }

    send = (args: IpcChangeArgs): void => {
        if (this.shouldSendChange(args)) {
            this.ipc.send('change', args);
            this.updateAllWindows(args, this.windowId, false);
        }
    }

    onSetupChanged = (e, args: IpcChangeArgs, persist?: boolean): void => {
        console.log(`${this.constructor.name}.onSetupChanged(${args.type}, ${args.component}, ${persist}):`);
        this.processSetupChange(args);

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
            const plainSetup = JSON.parse(setupString);

            this.setupFromPlain(plainSetup);
        } else {
            console.warn(`${this.constructor.name}: loadSetup: no setup`);
        }
        return this.setup;
    }

    protected persist = (plainSetup): void => {
        console.log(`${this.constructor.name}.persist implemented`, plainSetup);
        this.storeSetup();
    }


    private storeSetup(): void {
        const setupString = JSON.stringify(this.setup);
        console.log(`${this.constructor.name}.storeSetup: ${setupString} `, this.setup);

        localStorage.setItem(Renderer.SETUP_KEY, setupString);
    }


    private static getConfigKey(browserId: string): string {
        return `browser-${browserId}-config`;
    }

    protected defaultConfig: Config = DefaultConfig;

    private loadAllConfig(): void {
        console.log(`${this.constructor.name}: loadAllConfig`);

        if (!this.setup) throw new Error(`${this.constructor.name}.loadAllConfig(): no setup`);

        for (const display of this.setup.displays.values()) {
            for (const browser of display.browsers.keys()) {
                this.loadConfig(browser);
            }
        }
        this.loadedAllConfig = true;
    }

    protected loadConfig(browserId: string): Config {
        try {
            let config: Config;

            if (!this.configs) throw new Error(`${this.constructor.name}.loadConfig(${browserId}) configs undefined`);

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

    private storeConfig(browserId: string, config: string | null): void {
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
    private browserId: string;
    private paper: Listeners = {};
    private browser: Browser;


    constructor() {
        super();

        const browserIdArg = process.argv.find((arg) => /^--browserid=/.test(arg));

        if (!browserIdArg ) {
            console.error(`${this.constructor.name}() missing arguments: browserId=${browserIdArg}`, process.argv);
            throw new Error(`${this.constructor.name}() missing arguments: browserId=${browserIdArg}: ${process.argv.join()}`);
        }
        this.browserId = browserIdArg.split('=')[1];

        let browser: Browser | undefined;
        for (const display of this.setup.displays.values()) {
            browser = display.browsers.get(this.browserId);
            if (browser) {
                break;
            }
        }

        if (!browser)
            throw new Error(`${this.constructor.name}() can't find browser ${this.browserId}`);        

        this.browser = browser;
        
        console.log(
            `${this.constructor.name}[${this.browserId}]():` +
            ` width=${this.browser.relative.width}/${this.browser.scaled?.width}/${this.browser.device?.width}` +
            ` height=${this.browser.relative.height}/${this.browser.scaled?.height}/${this.browser.device?.height}`,
            process.argv
        );

        this.connectToWallpaper();
    }


    private onRegisterPaper = (listeners: Listeners): void => {
        this.paper = listeners;

        // console.log(`${this.constructor.name}[${this.browserId}]: register`, listeners);

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
                    `${this.constructor.name}[${this.browserId}]: ERROR initial user setting:${initialError}:`,
                    initialError,
                    setting.general);
            }
        }
    }

    private initSizeListener(): void {
        if (this.paper.size) {
            // console.log(`${this.constructor.name}[${this.browserId}]: set size=${JSON.stringify(size)}`, size);

            autorun(
                () => {
                    try {
                        if (!this.paper.size) throw new Error(`${this.constructor.name}[${this.browserId}]: autorun size: lost size handler`);
                        if (!this.browser.scaled) throw new Error(`${this.constructor.name}[${this.browserId}]: autorun size: no scaled size to set`);

                        this.paper.size({ width: this.browser.scaled.width, height: this.browser.scaled.height });
                    } catch (initialError) {
                        console.error(
                            `${this.constructor.name}[${this.browserId}]: ${JSON.stringify(this.browser)}: ERROR setting size:${initialError}:`,
                            initialError,
                            this.browser);
                    }
                }
            );
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
    protected getWindowById = BrowserWindow.fromId;

    private ipc: IpcMain = electronIpcMain;

    constructor() {
        super();

        this.ipc.once('init', this.onInitialSetup);
        this.ipc.on('change', this.onSetupChanged);
    }

    onInitialSetup = (e, setup: SetupInterface): void => {
        this.setupFromPlain(setup);

        // console.log(`${this.constructor.name}.onInitialSetup: ${this.setup}`);
        if (!this.setup) throw new Error(`${this.constructor.name}.onInitialSetup no setup`);

        this.emit('init', this.setup);
    }

    getSetup(includeConfig: boolean): Promise<Setup> {
        throw new Error(`Main.getSetup(${includeConfig}): Use events instead: init, change`);
    }

    send = (args: IpcChangeArgs): void => {
        if (this.shouldSendChange(args)) {
            this.updateAllWindows(args, -1, true);
        }
    }

    onSetupChanged = (e, args: IpcChangeArgs, persist?: boolean): void => {
        console.log(`${this.constructor.name}.onSetupChanged(${args.type}, ${args.component}, ${persist}):`);
        // this.emit(Controller.change, new SetupDiff(update));
        this.processSetupChange(args);
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
        // console.log(`Config.Controller[${process.type}]: create Main`);
        controller = new Main();
        break;
    case 'renderer':
        if (process.argv.some((arg) => /^--browserid=/.test(arg))) {
            // console.log(`Config.Controller[${process.type}]: create Paper`);
            controller = new Paper();
        } else {
            // console.log(`Config.Controller[${process.type}]: create Renderer`);
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

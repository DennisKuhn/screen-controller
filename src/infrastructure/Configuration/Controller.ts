import { IMapDidChange, reaction } from 'mobx';
import { EventEmitter } from 'events';
import electron, { IpcRendererEvent, IpcMainEvent, BrowserWindow, ipcMain as electronIpcMain, ipcRenderer as electronIpcRenderer, remote } from 'electron';
import { isEqual } from 'lodash';
import { SetupBaseInterface, SetupItemId } from './SetupBaseInterface';
import { SetupBase } from './SetupBase';
import { create } from './SetupFactory';
import { RootID } from './RootInterface';
import { ScreenID } from './ScreenInterface';
import { ObservableSetupBaseMap } from './Container';

/**
 * Import basic required Setup Classes to call SetupFactory.register
 * Currently Setup->Screen->Display->Browser
 */
import { Root, registerWithFactory as explicitRegisterRoot } from './Root';
import { Screen, registerWithFactory as explicitRegisterScreen } from './Screen';
import { registerWithFactory as explicitRegisterDisplay } from './Display';
import { Browser, registerWithFactory as explicitRegisterBrowser } from './Browser';

explicitRegisterRoot();
explicitRegisterScreen();
explicitRegisterDisplay();
explicitRegisterBrowser();

type ChangeChannel = 'change';
type RegisterChannel = 'register';
type InitChannel = 'init';
type GetSetupChannel = 'getsetup';
type SetSetupChannel = 'setsetup';

interface IpcRenderer extends electron.IpcRenderer {
    send(channel: InitChannel): void;

    send(channel: ChangeChannel, update: SetupBaseInterface): void;

    send(channel: RegisterChannel, args: IpcRegisterArgs): void;

    send(channel: SetSetupChannel, args: SetupBaseInterface): void;

    /// From IpcWindow.send
    on(channel: ChangeChannel, listener: (event: IpcRendererEvent, update: SetupBaseInterface, persist: boolean) => void): this;

    on(channel: GetSetupChannel, listener: (event: IpcRendererEvent, id: SetupItemId, depth: number) => void): void;
}

interface IpcMain extends electron.IpcMain {
    once(channel: InitChannel, listener: (event: IpcMainEvent) => void): this;

    on(channel: ChangeChannel, listener: (event: IpcMainEvent, update: SetupBaseInterface) => void): this;
    on(channel: RegisterChannel, listener: (event: IpcMainEvent, args: IpcRegisterArgs) => void): this;
    on(channel: SetSetupChannel, listener: (event: IpcMainEvent, args: SetupBaseInterface) => void): this;
}

interface IpcWindow extends electron.WebContents {
    // send(channel: ChangeChannel, args: IpcAddBrowserArgs, persist?: boolean): void;
    // send(channel: ChangeChannel, args: IpcAddDisplayArgs, persist?: boolean): void;
    // send(channel: ChangeChannel, args: IpcDeleteArgs, persist?: boolean): void;
    // send(channel: ChangeChannel, args: IpcUpdateBrowserArgs, persist?: boolean): void;
    send(channel: GetSetupChannel, id: SetupItemId, depth: number): void;
    send(channel: ChangeChannel, update: SetupBaseInterface, persist: boolean): void;
}

interface IpcRegisterArgs {
    windowId: number;
    itemId: SetupItemId;
    depth: number;
}


export type LevelName = 'Setup' | 'Display' | 'Browser';

export declare interface Controller {
    /**
    *
    * @param id
    * @param depth 0=do not resolve children, -1 resolve all descendants, <n> resolve n-levels of decendants
    */
    getSetup(id: string, depth: number): Promise<SetupBase>;

    log(): void;
}

interface SetupPromise {
    id: string;
    depth: number;
    resolve: (setup: SetupBase) => void;
    reject: (reason: string) => void;
}

interface ConnectItemArgs {
    item: SetupBase;
    connectParent: boolean;
    persist: boolean;
    propagate: boolean;
}

/**
 */
abstract class ControllerImpl extends EventEmitter implements Controller {
    protected configs: Map<string, SetupBase> = new Map<string, SetupBase>();

    protected constructor() {
        super();
        // console.log(`ControllerImpl[${this.constructor.name}]`);
    }

    log(): void {
        console.log(`${this.constructor.name}.log()`);
    }

    setupPromises: SetupPromise[] = new Array<SetupPromise>();

    test(item: SetupBase, depth: number): boolean {
        if (depth != 0) {
            for (const [propertyName, value] of Object.entries(item)) {
                if (typeof value == 'object' && value instanceof ObservableSetupBaseMap) {
                    const container = value as ObservableSetupBaseMap<SetupBase>;
                    console.log(`${this.constructor.name}.test(${item.id}, ${depth}): process ${propertyName} as ObservableSetupBaseMap#${container.size}`);

                    for (const [childId, child] of container.entries()) {
                        if ((child == null) || (!this.test(child, depth - 1))) {
                            console.warn(`${this.constructor.name}.test(${item.id}, ${depth}):${propertyName} failed: [${childId}] == ${child}`);
                            return false;
                        } else {
                            console.warn(`${this.constructor.name}.test(${item.id}, ${depth}):${propertyName} success: [${childId}]`);
                        }
                    }
                } else {
                    console.log(`${this.constructor.name}.test(${item.id}, ${depth}): skip ${propertyName}`);
                }
            }
        } else {
            console.log(`${this.constructor.name}.test(${item.id}, ${depth}): reached bottom`);
        }
        console.log(`${this.constructor.name}.test(${item.id}, ${depth}): successful`);
        return true;
    }

    tryGetItem(id: string, depth: number): SetupBase | undefined {
        const responseItem: SetupBase | undefined = this.configs.get(id);

        if (responseItem && this.test(responseItem, depth)) {
            return responseItem;
        }
        return undefined;
    }

    protected onCached: ((item: SetupBase, depth: number) => void) | undefined;

    getSetup(id: string, depth: number): Promise<SetupBase> {
        // console.log(`ControllerImpl[${this.constructor.name}].getSetup(${id}, ${depth})`);

        return new Promise(
            (resolve: (setup: SetupBase) => void, reject: (reason: string) => void) => {

                const responseItem: SetupBase | undefined = this.tryGetItem(id, depth);

                if (responseItem) {
                    console.log(`ControllerImpl[${this.constructor.name}].getSetup(${id}, ${depth}) resolve now - promises=${this.setupPromises.length}`, responseItem);
                    if (this.onCached)
                        this.onCached(responseItem, depth);
                    resolve(responseItem);
                } else {
                    if (this.setupPromises.push({ resolve: resolve, reject: reject, id: id, depth: depth }) == 1) {
                        // console.log(`ControllerImpl[${this.constructor.name}].getSetup(${id}, ${depth}) process now promises=${this.setupPromises.length}`);
                        this.processPromise();
                    } else {
                        // console.log(`ControllerImpl[${this.constructor.name}].getSetup(${id}, ${depth}) wait promises=${this.setupPromises.length}`);
                    }
                }
            }
        );
    }

    /**
     * Retrieves a SetupItem and all its children up to depth.
     * Each property is tested if ObservableSetupBaseMap, if depth != 0, load children otherwise set each child entry to null
     * @param id of the setup item to get
     * @param depth minimum of the resulting tree (The result might be deeper). Use -1 to load all descendants
     */
    async getTree(id: string, depth: number): Promise<SetupBase> {
        let responseItem: SetupBase | undefined = this.configs.get(id);

        if (responseItem) {
            if (depth != 0) {
                for (const [propertyName, value] of Object.entries(responseItem)) {
                    if (typeof value == 'object' && value instanceof ObservableSetupBaseMap) {
                        console.log(`${this.constructor.name}.getTree(${id}, ${depth}): process ${propertyName} as ObservableSetupBaseMap`);
                        const container = value as ObservableSetupBaseMap<SetupBase>;

                        for (const childId of container.keys()) {
                            const childTree = await this.getTree(childId, depth - 1);
                            if (container.get(childId) == null) {
                                console.log(`${this.constructor.name}.getTree(${id}, ${depth}): ${propertyName} set [${childId}]`);
                                container.set(
                                    childId,
                                    childTree
                                );
                            } else {
                                console.log(`${this.constructor.name}.getTree(${id}, ${depth}): ${propertyName} already set [${childId}]`);
                            }
                        }
                    } else {
                        console.log(`${this.constructor.name}.getTree(${id}, ${depth}): skip ${propertyName}`);
                    }
                }
            } else {
                console.log(`${this.constructor.name}.getTree(${id}, ${depth}): reached bottom`);
            }
        } else {
            responseItem = await this.getSetupImpl(id, depth);
        }

        return responseItem;
    }

    async processPromise(): Promise<void> {

        do {
            const { id, depth, resolve } = this.setupPromises[0];
            // console.log(`ControllerImpl[${this.constructor.name}].processPromise(${oldestPromise.id}, ${oldestPromise.depth}) 1/${this.setupPromises.length} ...`);

            const tree = await this.getTree(id, depth);
            this.connectPersistPropagate({ item: tree, connectParent: true, persist: false, propagate: false });
            console.log(`ControllerImpl[${this.constructor.name}].processPromise(${id}, ${depth}) resolve 1/${this.setupPromises.length}`, tree);
            resolve(tree);
            this.setupPromises.splice(0, 1);

        } while (this.setupPromises.length);
    }

    protected onItemConnected: ((item: SetupBase, newItem: boolean) => void) | undefined;


    protected connectPersistPropagate(args: ConnectItemArgs): void {
        const { item, connectParent, persist, propagate } = args;

        if (!this.configs.has(item.id)) {
            console.log(`${this.constructor.name}.connectPersistPropagate( ${item.className}[${item.id}], connect=${connectParent}, persist=${persist}, propagate=${propagate} )`);
            if (connectParent) {
                const parent = this.configs.get(item.parentId);

                if (parent) {
                    for (const [propertyName, value] of Object.entries(parent)) {
                        if (typeof value == 'object' && value instanceof ObservableSetupBaseMap) {
                            console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}): parent ${item.parentId}: try ${propertyName}`);
                            const container = value as ObservableSetupBaseMap<SetupBase>;

                            const prospect = container.get(item.id);

                            if (prospect == null) {
                                console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}): parent ${item.parentId}: set in ${propertyName}`);
                                container.set(item.id, item);
                                break;
                            } else if (prospect == undefined) {
                                console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}): parent ${item.parentId}: not in ${propertyName}`);
                            } else {
                                console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}): parent ${item.parentId}: already in ${propertyName}`, item, prospect);
                            }
                        } else {
                            console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}): parent ${item.parentId}: skip ${propertyName}`);
                        }
                    }
                } else {
                    console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}): parent ${item.parentId} doesn't exist (yet)`);
                }
            }
            // console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}, ${persist})`);

            this.configs.set(item.id, item);

            if (this.persist) {
                const fPersist = this.persist;
                // console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}) persist fireImmediately=${persist}`);
                reaction(
                    () => {
                        // console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}).persist.expression= `, item.shallow);
                        return item.getShallow();
                    },
                    (update: SetupBaseInterface): void => {
                        if (isEqual(update, this.remoteUpdates.get(update.id))) {
                            console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}).persist skip received=`, update);
                        } else {
                            fPersist(update);
                        }
                    },
                    {
                        name: `${this.constructor.name}[${item.id}].persist`,
                        delay: 1,
                        fireImmediately: persist
                    }
                );
            }

            if (this.propagate) {
                const fPropagate = this.propagate;

                // console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}) popagate`);
                reaction(
                    () => {
                        // console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}).propagate.expression=`, item.shallow);
                        return item.getShallow();
                    },
                    (update: SetupBaseInterface): void => {
                        if (isEqual(update, this.remoteUpdates.get(update.id))) {
                            // console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}).propagate skip received=`, update);
                        } else {
                            fPropagate(update);
                        }
                    },
                    {
                        name: `${this.constructor.name}[${item.id}].propagate`,
                        delay: 1,
                        fireImmediately: propagate
                    }
                );
            }
            for (const [propertyName, value] of Object.entries(item)) {
                if (typeof value == 'object' && value instanceof ObservableSetupBaseMap) {
                    console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}): observe ${propertyName} as ObservableSetupBaseMap`);
                    const container = value as ObservableSetupBaseMap<SetupBase>;
                    container.observe(this.onMapChange);
                } else {
                    console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}): not observe ${propertyName} as not ObservableSetupBaseMap`);
                }
            }

            if (this.onItemConnected) {
                this.onItemConnected(item, propagate);
            }
        } else {
            // console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}) skip already connected`);
        }
        for (const [propertyName, value] of Object.entries(item)) {
            if (typeof value == 'object' && value instanceof ObservableSetupBaseMap) {
                console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}): connect children ${propertyName} as ObservableSetupBaseMap`);
                const container = value as ObservableSetupBaseMap<SetupBase>;
                for (const child of container.values()) {
                    if (child) {
                        this.connectPersistPropagate({ ...args, item: child, connectParent: false, propagate: false });
                    }
                }
            } else {
                console.log(`${this.constructor.name}.connectPersistPropagate(${item.id}): not connect children ${propertyName} as not ObservableSetupBaseMap`);
            }
        }
    }

    private onMapChange = (changes: IMapDidChange<string, SetupBase | null>): void => {
        // console.log(`${this.constructor.name}.onMapChange(${changes.type} - ${changes.name})`);
        switch (changes.type) {
            case 'add':
                if (changes.newValue) {
                    this.connectPersistPropagate({ item: changes.newValue, connectParent: false, persist: true, propagate: true });
                }
                break;
            case 'delete':
                break;
            case 'update':
                if (changes.oldValue)
                    throw new Error(`${this.constructor.name}.onMapChange(-> ${changes.type} <-) no re-assigning`);
        }
    }

    protected abstract getSetupImpl(id: string, depth: number): Promise<SetupBase>;

    protected readonly propagate: ((item: SetupBaseInterface) => void) | undefined;

    protected persist: ((item: SetupBaseInterface) => void) | undefined;

    private remoteUpdates: Map<string, SetupBaseInterface> = new Map<string, SetupBaseInterface>();

    private addRemoteUpdate(item: SetupBaseInterface): void {
        this.remoteUpdates.set(item.id, item);

        for (const [propertyName, value] of Object.entries(item)) {
            if (typeof value == 'object' && value instanceof ObservableSetupBaseMap) {
                console.log(`${this.constructor.name}.addRemoteUpdate(${item.id}): add children in ${propertyName}`);
                const container = value as ObservableSetupBaseMap<SetupBase>;
                for (const child of container.values()) {
                    if (child) {
                        this.addRemoteUpdate(child);
                    }
                }
            } else {
                console.log(`${this.constructor.name}.addRemoteUpdate(${item.id}): don't add children in ${propertyName} as not ObservableSetupBaseMap`);
            }
        }
    }

    onSetupChanged = (e: Event, update: SetupBaseInterface, persist?: boolean): void => {
        // console.log(`${this.constructor.name}.onSetupChanged(${update.className}[${update.id}], persist=${persist}):`, update);
        let localItem = this.configs.get(update.id);
        const sender = (e as IpcMainEvent).sender ? (e as IpcMainEvent).sender.id : ((e as IpcRendererEvent).senderId ? (e as IpcRendererEvent).senderId : '?');

        this.addRemoteUpdate(update);

        if (localItem) {
            console.log(`${this.constructor.name}.onSetupChanged(${sender}): ${update.className}[${update.id}] persist=${persist} update`, { ...update });
            localItem.update(update);
        } else {
            console.log(`${this.constructor.name}.onSetupChanged(${sender}): ${update.className}[${update.id}] persist=${persist} create`, { ...update });
            localItem = create(update);
            this.connectPersistPropagate({ item: localItem, connectParent: true, persist: false, propagate: false });
        }
        if (this.persist && persist) {
            this.persist(update);
        }
    }
}


class Renderer extends ControllerImpl {
    protected ipc: IpcRenderer = electronIpcRenderer;

    private windowId: number;

    constructor() {
        super();

        this.windowId = remote.getCurrentWindow().id;

        // console.log(`${this.constructor.name}() ${this.windowId}`);

        this.ipc.on('change', this.onSetupChanged);
    }


    protected getSetupSync(id: string, depth: number): SetupBase {

        const responseItem: SetupBase = this.configs.get(id) ?? this.load(id);

        if (depth != 0) {
            for (const [propertyName, value] of Object.entries(responseItem)) {
                if (typeof value == 'object' && value instanceof ObservableSetupBaseMap) {
                    console.log(`${this.constructor.name}.getSetupSync(${id}): add children in ${propertyName}`);
                    const container = value as ObservableSetupBaseMap<SetupBase>;
                    for (const itemId of container.keys()) {
                        container.set(
                            itemId,
                            this.getSetupSync(itemId, depth - 1)
                        );
                    }
                } else {
                    console.log(`${this.constructor.name}.getSetupSync(${id}): don't add children in ${propertyName} as not ObservableSetupBaseMap`);
                }
            }
        }

        return responseItem;
    }

    private registrations = new Array<{ itemId: SetupItemId; depth: number }>()

    protected onCached = (item: SetupBase, depth: number): void => {

        this.registerWithMain(item, depth);
    }

    protected registerWithMain(item: SetupBase, depth: number): void {

        let registration = this.registrations.find(candidate => candidate.itemId == item.id);

        if (!(registration && registration.depth >= depth)) {
            if (!registration) {
                registration = { itemId: item.id, depth: depth };
                this.registrations.push(registration);
            } else {
                registration.depth = depth;
            }
            this.ipc.send('register', { windowId: this.windowId, itemId: item.id, depth: depth });
        }
    }

    protected async getSetupImpl(id: string, depth: number): Promise<SetupBase> {
        const item = this.getSetupSync(id, depth);

        this.registerWithMain(item, depth);

        return item;
    }

    private load(id: string): SetupBase {
        // console.log(`${this.constructor.name}: load(${id})`);
        const itemString = localStorage.getItem(id);
        let item: SetupBase;

        if (itemString) {
            console.log(`${this.constructor.name}: load(${id}): ${itemString}`);

            const itemPlain: SetupBaseInterface = JSON.parse(itemString);

            item = create(itemPlain);
        } else if (id as RootID == 'Root') {
            item = Root.createNewBlank();
            console.warn(`${this.constructor.name}: load(${id}): new Blank`, item);
            this.persist(item);
        } else if (id as ScreenID == 'Screen') {
            item = Screen.createNewBlank();
            console.warn(`${this.constructor.name}: load(${id}): new Blank`, item);
            this.persist(item);
        } else {
            throw new Error(`${this.constructor.name}: load(-> ${id} <-): not found`);
        }
        return item;
    }

    protected readonly propagate = (item: SetupBaseInterface): void => {
        console.log(`${this.constructor.name}.propapgate(${item.id}) send to main=`, item);
        this.ipc.send('change', item);
    }

    protected persist = (item: SetupBaseInterface): void => {
        console.log(`${this.constructor.name}.persist(${item.id})`, item);

        localStorage.setItem(item.id, JSON.stringify(item));
    }
}


type Size = { width: number; height: number };
type SizeCallback = (size: Size) => void;

/**
 * Renderer Config Controller for Wallpaper Browsers. Deal with size
 */
class Paper extends Renderer {
    private browserId: string;
    private browser: Browser | undefined;


    constructor() {
        super();

        const browserIdArg = process.argv.find((arg) => /^--browserid=/.test(arg));

        if (!browserIdArg) {
            console.error(`${this.constructor.name}() missing arguments: browserId=${browserIdArg}`, process.argv);
            throw new Error(`${this.constructor.name}() missing arguments: browserId=${browserIdArg}: ${process.argv.join()}`);
        }
        this.browserId = browserIdArg.split('=')[1];

        // console.log(`${this.constructor.name}[${this.browserId}]()`, process.argv);

        this.getSetup(this.browserId, -1).then(
            browser => {
                this.browser = browser as Browser;

                // console.log(
                //     `${this.constructor.name}[${this.browserId}](): got Browser:` +
                //     ` width=${this.browser.relative.width}/${this.browser.scaled?.width}/${this.browser.device?.width}` +
                //     ` height=${this.browser.relative.height}/${this.browser.scaled?.height}/${this.browser.device?.height}`
                // );
            }
        );
    }


}

class MainWindow extends Renderer {

    constructor() {
        super();

        // console.log(`${this.constructor.name}()`, process.argv);

        this.ipc.send('init');

        this.ipc.on('getsetup', this.onGetSetup);
    }

    onGetSetup = async (e, id: string, depth: number): Promise<void> => {
        const setup = (await this.getSetup(id, depth)).getDeep();
        console.log(`${this.constructor.name}.onGetSetup(${id}, ${depth}) send:`, setup );

        this.ipc.send(
            'setsetup',
            setup
        );
    }
}

interface ChangeListener {
    windowId: number;
    ipc: IpcWindow;
    itemId: SetupItemId;
    depth: number;
}

class Main extends ControllerImpl {
    protected getAllWindows = BrowserWindow.getAllWindows;
    protected getWindowById = BrowserWindow.fromId;

    private ipc: IpcMain = electronIpcMain;

    private ipcStorage: IpcWindow | undefined;

    private promises = new Array<SetupPromise>();
    private changeListeners = new Array<ChangeListener>();

    constructor() {
        super();

        this.ipc.once('init', this.onInit);

        this.ipc.on('change', this.onSetupChanged);
        this.ipc.on('register', this.onRegister);
        this.ipc.on('setsetup', this.onSetSetup);
    }

    private onRegister = (e: IpcMainEvent, { windowId, itemId, depth }: IpcRegisterArgs): void => {
        const existingWindowListeners = this.changeListeners.filter(listener => listener.windowId == windowId);
        let listener: ChangeListener | undefined;
        let offset = 0;

        if (existingWindowListeners.length) {
            for (const existingListener of existingWindowListeners) {
                if (existingListener.itemId == itemId) {
                    // console.log(`${this.constructor.name}.onRegister[${this.changeListeners.length}]` +
                    //     `(w=${windowId}/${e.sender.id}, ${itemId}, d=${depth}): listening (${existingListener.depth})`);
                    listener = existingListener;

                    if (existingListener.depth < depth) {
                        offset = existingListener.depth;
                        existingListener.depth = depth;
                    }
                    break;
                }
            }
        }
        if (!listener) {
            // console.log(`${this.constructor.name}.onRegister[${this.changeListeners.length}]` +
            //     `(w=${windowId}/${e.sender.id}, ${itemId}, d=${depth} ): new listener`);
            listener = {
                windowId: windowId,
                ipc: BrowserWindow.fromId(windowId).webContents,
                itemId: itemId,
                depth: depth
            };
            this.changeListeners.push(listener);
        }
        this.connectChangeListenerToExisting(listener, offset);
    }

    connectChangeListenerToExisting(listener: ChangeListener, listenerOffset: number): void {
        for (const item of this.configs.values()) {
            for (let itemOffset = 0, ancestor: SetupBase | undefined = item;
                ((listener.depth == -1) || (itemOffset <= listener.depth)) && (ancestor);
                itemOffset += 1, ancestor = this.configs.get(ancestor.parentId)) {
                if (listener.itemId == ancestor.id) {
                    if (itemOffset >= listenerOffset) {
                        // console.log(`${this.constructor.name}.connectChangeListenerToExisting([${listener.windowId},${listener.itemId},${listener.depth}], ${listenerOffset})` +
                        //     ` connect ${item.id} @${listener.depth - itemOffset}`);
                        this.connectChangeListener(item, listener, false, itemOffset);
                    } else {
                        // console.log(`${this.constructor.name}.connectChangeListenerToExisting([${listener.windowId},${listener.itemId},${listener.depth}], ${listenerOffset})` +
                        //     ` already connected ${item.id} @${listener.depth - itemOffset}`);
                    }
                    break;
                }
            }
        }
    }

    private connectChangeListener(item: SetupBase, listener: ChangeListener, fireImmediately: boolean, offset = 0): void {
        // console.log(`${this.constructor.name}.connectChangeListener[${listener.windowId},${listener.itemId},${listener.depth}] ${item.id} @${listener.depth - offset}`);
        reaction(
            (/*r*/) => {
                // console.log(`${this.constructor.name}.changeListener[${listener.windowId},${listener.itemId},${listener.depth}].expression ${item.id}@${listener.depth-offset}`);
                return item.getShallow();
            },
            (updatedItem, /*r*/) => {
                console.log(`${this.constructor.name}.changeListener[${listener.windowId},${listener.itemId},${listener.depth}].effect ${item.id} @${listener.depth - offset}`);
                listener.ipc.send('change', updatedItem, false);
            },
            {
                name: `changeListener[${listener.windowId},${listener.itemId},${listener.depth}] ${item.id} @${listener.depth - offset}`,
                fireImmediately: fireImmediately,
                delay: 1
            }
        );
    }

    private connectChangeListeners(item: SetupBase, fireImmediately: boolean): void {
        // console.log(`${this.constructor.name}.connectChangeListeners[${this.changeListeners.length}](${item.id},${fireImmediately})`);
        for (const listener of this.changeListeners) {
            /// Check if ancestor in within depth is listening
            for (let offset = 0, ancestor: SetupBase | undefined = item; (offset <= listener.depth) && (ancestor); offset += 1, ancestor = this.configs.get(ancestor.parentId)) {
                if (listener.itemId == ancestor.id) {
                    this.connectChangeListener(item, listener, fireImmediately, offset);
                    break;
                }
            }
        }
    }

    protected onItemConnected = (item: SetupBase, fireImmediately: boolean): void => {
        // console.log(`${this.constructor.name}.onItemConnected(${item.id}) fireImmediately=${fireImmediately}`);
        this.connectChangeListeners(item, fireImmediately);
    }

    private onSetSetup = (e, item: SetupBaseInterface): void => {

        console.log(`${this.constructor.name}.onSetSetup: promises=${this.promises.length}`, item);

        const currentPromise = this.promises[0];

        const response = create(item);

        if (this.promises.length != 1) {
            console.error(`${this.constructor.name}.onSetSetup: promises.length=${this.promises.length} should be 1`);
        }
        this.promises.splice(0, 1);

        currentPromise.resolve(response);
    }


    private onInit = (e: IpcMainEvent): void => {
        /// Probably received Setup through register triggered by getting setup

        // console.log(`${this.constructor.name}.onInit: sender=${e.sender}`);
        this.ipcStorage = e.sender;

        this.requestPromises();
    }

    private requestPromises(): void {
        // console.log(`${this.constructor.name}.requestPromises[${this.promises.length}]`);

        if (!this.ipcStorage) throw new Error(`${this.constructor.name}.requestPromises[${this.promises.length}]: no ipcStorage`);

        if (this.promises.length) {
            if (this.promises.length != 1) {
                console.error(`${this.constructor.name}.requestPromises: promises.length=${this.promises.length} should be 1`);
            }
            const firstPromise = this.promises[0];

            this.ipcStorage.send('getsetup', firstPromise.id, firstPromise.depth);
        }
    }

    protected getSetupImpl(id: string, depth: number): Promise<SetupBase> {
        return new Promise(
            (resolve, reject) => {
                const responseItem: SetupBase | undefined = this.configs.get(id);

                if (!responseItem) {
                    this.promises.push({ id: id, depth: depth, resolve: resolve, reject: reject });

                    if (this.ipcStorage) {
                        // console.log(`${this.constructor.name}.getSetupImpl(${id}, ${depth}): requesting promises=${this.promises.length}`);
                        this.requestPromises();
                    } else {
                        // console.log(`${this.constructor.name}.getSetupImpl(${id}, ${depth}): wait for init promises=${this.promises.length}`);
                    }
                } else {
                    // console.log(`${this.constructor.name}.getSetupImpl(${id}, ${depth}): resolve` /*, responseItem.getPlainDeep() */);
                    resolve(responseItem);
                }
                return responseItem;
            });
    }

    // protected readonly propagate = (item: SetupBaseInterface): void => {
    //     console.log(`${this.constructor.name}.propapgate(${item.id})`, item);
    // }

    protected persist = (item: SetupBaseInterface): void => {
        console.log(`${this.constructor.name}.persist(${item.id})`, item);

        this.ipcStorage?.send('change', item, true);
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
        } else if (process.argv.some((arg) => /^--mainwindow/.test(arg))) {
            // console.log(`Config.Controller[${process.type}]: create Renderer`);
            controller = new MainWindow();
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

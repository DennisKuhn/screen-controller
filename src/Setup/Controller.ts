import { IMapDidChange, reaction, isObservableProp } from 'mobx';
import { EventEmitter } from 'events';
import electron, { IpcRendererEvent, IpcMainEvent, BrowserWindow, ipcMain as electronIpcMain, ipcRenderer as electronIpcRenderer, remote } from 'electron';
import { isEqual } from 'lodash';
import { SetupBase, PropertyType as ObjectPropertyType } from './SetupBase';
import { SetupItemId, SetupBaseInterface, PropertyKey, PropertyType as InterfacePropertyType, SetupLinkInterface } from './SetupInterface';
import { create } from './SetupFactory';
import { ObservableSetupBaseMap } from './Container';

/**
 * Import basic required Setup Classes to call SetupFactory.register
 * Currently Setup->Screen->Display->Browser->Rectangle
 */

import { Root } from './Application/Root';
import { Screen } from './Application/Screen';
import { Browser } from './Application/Browser';
import { Plugin } from './Application/Plugin';
import { JSONSchema7 } from 'json-schema';

type ChangeChannel = 'change';
type RegisterChannel = 'register';
type InitChannel = 'init';



interface IpcChangeArgs {
    item: SetupItemId;
    name: PropertyKey;
    type: string;
}

interface IpcAddArgs extends IpcChangeArgs {
    type: 'add';
    newValue: InterfacePropertyType;
}

interface IpcUpdateArgs extends IpcChangeArgs {
    type: 'update';
    newValue: InterfacePropertyType;
}

interface IpcRemoveArgs extends IpcChangeArgs {
    type: 'remove';
}

interface IpcMapChangeArgs extends IpcChangeArgs {
    map: PropertyKey;
}

interface IpcMapAddArgs extends IpcMapChangeArgs {
    type: 'add';
    newValue: SetupBaseInterface | null;
}

interface IpcMapUpdateArgs extends IpcMapChangeArgs {
    type: 'update';
    newValue: SetupBaseInterface | null;
}

interface IpcMapDeleteArgs extends IpcMapChangeArgs {
    type: 'delete';
}

interface IpcInitArgs {
    schema: JSONSchema7;
    root: SetupBaseInterface;
}

type IpcChangeArgsType = IpcAddArgs | IpcUpdateArgs | IpcRemoveArgs | IpcMapAddArgs | IpcMapUpdateArgs | IpcMapDeleteArgs;
type IpcItemChangeArgsType = IpcAddArgs | IpcUpdateArgs | IpcRemoveArgs;


interface IpcRenderer extends electron.IpcRenderer {
    send(channel: InitChannel, init: IpcInitArgs): void;

    send(channel: ChangeChannel, update: IpcChangeArgsType): void;

    send(channel: RegisterChannel, args: IpcRegisterArgs): void;

    /// From IpcWindow.send
    on(channel: ChangeChannel, listener: (event: IpcRendererEvent, update: IpcChangeArgsType, persist?: boolean) => void): this;

}

interface IpcMain extends electron.IpcMain {
    once(channel: InitChannel, listener: (event: IpcMainEvent, init: IpcInitArgs) => void): this;

    on(channel: ChangeChannel, listener: (event: IpcMainEvent, update: IpcChangeArgsType, persist?: boolean) => void): this;

    on(channel: RegisterChannel, listener: (event: IpcMainEvent, args: IpcRegisterArgs) => void): this;
}

interface IpcWindow extends electron.WebContents {
    send(channel: ChangeChannel, update: IpcChangeArgsType, persist: boolean): void;
}

interface IpcRegisterArgs {
    itemId: SetupItemId;
    depth: number;
}


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
    persist: boolean;
    propagate: boolean;
}

interface LocalChangeArgs {
    item: SetupBase;
    name: string;
    type: 'add' | 'update' | 'remove' | 'delete';
}

interface LocalItemUpdateArgs extends LocalChangeArgs {
    type: 'update';
    newValue: ObjectPropertyType;
}

interface LocalItemAddArgs extends LocalChangeArgs {
    type: 'add';
    newValue: ObjectPropertyType;
}

interface LocalItemRemoveArgs extends LocalChangeArgs {
    type: 'remove';
}

interface LocalMapArgs extends LocalChangeArgs {
    map: string;
}

interface LocalMapDeleteArgs extends LocalMapArgs {
    type: 'delete';
}

interface LocalMapAddArgs extends LocalMapArgs {
    type: 'add';
    newValue: SetupBase | null;
}

interface LocalMapUpdateArgs extends LocalMapArgs {
    type: 'update';
    newValue: SetupBase | null;
}

type LocalChangeArgsType = LocalItemUpdateArgs | LocalItemAddArgs | LocalItemRemoveArgs | LocalMapDeleteArgs | LocalMapAddArgs | LocalMapUpdateArgs;
type LocalItemChangeArgsType = LocalItemUpdateArgs | LocalItemAddArgs | LocalItemRemoveArgs;

/**
 */
abstract class ControllerImpl extends EventEmitter implements Controller {
    protected configs: Map<string, SetupBase> = new Map<string, SetupBase>();

    protected constructor() {
        super();
        // console.log(`ControllerImpl[${this.constructor.name}]`);
    }

    log(): void {
        console.log(`ControllerImpl[${this.constructor.name}].log()`);
    }

    setupPromises: SetupPromise[] = new Array<SetupPromise>();

    test(item: SetupBase, depth: number): boolean {
        if (depth != 0) {
            for (const [/*propertyName*/, value] of Object.entries(item)) {
                if (typeof value == 'object' && value instanceof ObservableSetupBaseMap) {
                    const container = value as ObservableSetupBaseMap<SetupBase>;
                    // console.log(`ControllerImpl[${this.constructor.name}].test(${item.id}, ${depth}): process ${propertyName} as ObservableSetupBaseMap#${container.size}`);

                    for (const [/*childId*/, child] of container.entries()) {
                        if ((child == null) || (!this.test(child, depth - 1))) {
                            // console.log(`ControllerImpl[${this.constructor.name}].test(${item.id}, ${depth}):${propertyName} failed: [${childId}] == ${child}`);
                            return false;
                        } else {
                            // console.log(`ControllerImpl[${this.constructor.name}].test(${item.id}, ${depth}):${propertyName} success: [${childId}]`);
                        }
                    }
                } else {
                    // console.log(`ControllerImpl[${this.constructor.name}].test(${item.id}, ${depth}): skip ${propertyName}`);
                }
            }
        } else {
            // console.log(`ControllerImpl[${this.constructor.name}].test(${item.id}, ${depth}): reached bottom`);
        }
        // console.log(`ControllerImpl[${this.constructor.name}].test(${item.id}, ${depth}): successful`);
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
                        console.log(`ControllerImpl[${this.constructor.name}].getSetup(${id}, ${depth}) process now - promises=${this.setupPromises.length}`);
                        this.processPromise();
                    } else {
                        console.log(`ControllerImpl[${this.constructor.name}].getSetup(${id}, ${depth}) wait - promises=${this.setupPromises.length}`);
                    }
                }
            }
        );
    }

    /**
     * Retrieves a SetupBase and all its children up to depth.
     * Each property is tested if ObservableSetupBaseMap, if depth != 0, load children otherwise set each child entry to null
     * @param id of the setup item to get
     * @param depth minimum of the resulting tree (The result might be deeper). Use -1 to load all descendants
     */
    async getTree(id: string, depth: number): Promise<SetupBase> {
        let responseItem: SetupBase | undefined = this.configs.get(id);

        if (responseItem) {
            if (depth != 0) {
                for (const [/*propertyName*/, value] of Object.entries(responseItem)) {
                    if (typeof value == 'object' && value instanceof ObservableSetupBaseMap) {
                        // console.log(`ControllerImpl[${this.constructor.name}].getTree(${id}, ${depth}): process ${propertyName} as ObservableSetupBaseMap`);
                        const container = value as ObservableSetupBaseMap<SetupBase>;

                        for (const childId of container.keys()) {
                            const childTree = await this.getTree(childId, depth - 1);
                            if (container.get(childId) == null) {
                                // console.log(`ControllerImpl[${this.constructor.name}].getTree(${id}, ${depth}): ${propertyName} set [${childId}]`);
                                container.set(
                                    childId,
                                    childTree
                                );
                            } else {
                                // console.log(`ControllerImpl[${this.constructor.name}].getTree(${id}, ${depth}): ${propertyName} already set [${childId}]`);
                            }
                        }
                    } else {
                        // console.log(`ControllerImpl[${this.constructor.name}].getTree(${id}, ${depth}): skip ${propertyName}`);
                    }
                }
            } else {
                // console.log(`ControllerImpl[${this.constructor.name}].getTree(${id}, ${depth}): reached bottom`);
            }
        } else {
            responseItem = await this.getSetupImpl(id, depth);
        }

        return responseItem;
    }

    async processPromise(): Promise<void> {

        do {
            const { id, depth, resolve } = this.setupPromises[0];

            console.log(`ControllerImpl[${this.constructor.name}].processPromise(${id}, ${depth}) 1/${this.setupPromises.length} ...`);

            const tree = await this.getTree(id, depth);
            this.connectPersistPropagate({ item: tree, persist: false, propagate: false });

            console.log(`ControllerImpl[${this.constructor.name}].processPromise(${id}, ${depth}) ... resolve 1/${this.setupPromises.length}`, tree);
            resolve(tree);
            this.setupPromises.splice(0, 1);

        } while (this.setupPromises.length);
    }

    protected onItemConnected: ((item: SetupBase, newItem: boolean) => void) | undefined;


    protected connectPersistPropagate(args: ConnectItemArgs): void {
        const { item, persist, propagate } = args;

        if (!this.configs.has(item.id)) {
            console.log(
                `ControllerImpl[${this.constructor.name}].connectPersistPropagate( ${item.className}[${item.id}],` +
                `persist=${persist}, propagate=${propagate} )`);

            this.configs.set(item.id, item);

            for (const [propertyName, value] of Object.entries(item)) {
                if (value instanceof ObservableSetupBaseMap) {
                    // console.log(`ControllerImpl[${this.constructor.name}].connectPersistPropagate(${item.id}): observe ${propertyName} as ObservableSetupBaseMap`);
                    (value as ObservableSetupBaseMap<SetupBase>).observe((changes: IMapDidChange<string, SetupBase | null>) => {
                        this.onMapChange(item.id, propertyName, changes);
                    });
                } else if (isObservableProp(item, propertyName)) {
                    // console.log(`ControllerImpl[${this.constructor.name}].connectPersistPropagate(${item.id}): observe ${propertyName}` );

                    reaction(
                        () => item[propertyName],
                        newValue => this.onItemChanged({ item, name: propertyName, type: 'update', newValue }),
                        {
                            name: `${this.constructor.name}.PersistPropagate[${item.className}][${item.id}].${propertyName}`
                        }
                    );
                } else {
                    // console.log(`ControllerImpl[${this.constructor.name}].connectPersistPropagate(${item.id}): ignore ${propertyName}`);
                }
            }

            if (this.onItemConnected) {
                this.onItemConnected(item, propagate);
            }
        } else {
            // console.log(`ControllerImpl[${this.constructor.name}].connectPersistPropagate(${item.id}) skip already connected`);
        }

        // Connect child objects (SetupBase) in maps and properties
        for (const [ /*propertyName*/, value] of Object.entries(item)) {
            if (value instanceof ObservableSetupBaseMap) {
                // console.log(`ControllerImpl[${this.constructor.name}].connectPersistPropagate(${item.id}): connect children ${propertyName} as ObservableSetupBaseMap`);
                const container = value as ObservableSetupBaseMap<SetupBase>;
                for (const child of container.values()) {
                    if (child) {
                        this.connectPersistPropagate({ ...args, item: child, propagate: false });
                    }
                }
            } else if (value instanceof SetupBase) {
                this.connectPersistPropagate({ ...args, item: value, propagate: false });
            } else {
                // console.log(`ControllerImpl[${this.constructor.name}].connectPersistPropagate(${item.id}): not connect children ${propertyName} as not ObservableSetupBaseMap`);
            }
        }
    }

    getPlainValue = (objectValue: ObjectPropertyType): InterfacePropertyType => {
        switch (typeof objectValue) {
            case 'boolean':
            case 'number':
            case 'string':
                return objectValue;
                break;
            case 'object':
                if (objectValue instanceof SetupBase) {
                    return objectValue.getShallow();
                } else if (objectValue instanceof ObservableSetupBaseMap) {
                    // console.log(`ControllerImpl[${this.constructor.name}].getPlainValue: copy ${propertyName} of ObservableSetupBaseMap`);

                    const shallow = {};
                    for (const id of objectValue.keys()) {
                        shallow[id] = null;
                    }
                    return shallow;
                }
                throw new Error(`ControllerImpl[${this.constructor.name}].getPlainValue(${objectValue}) not supported so far: ${typeof objectValue}`);
            default:
                throw new Error(`ControllerImpl[${this.constructor.name}].getPlainValue(${objectValue}) not supported so far: ${typeof objectValue}`);
        }
    }

    static createLinks(item: SetupBaseInterface): void {
        for (const [propertyName, value] of Object.entries(item)) {
            const setup = (value as SetupBaseInterface);

            if (setup.id) {
                item[propertyName] = { id: setup.id };
            }
        }
    }

    getValue = (plainValue: InterfacePropertyType, persist: boolean): ObjectPropertyType => {
        switch (typeof plainValue) {
            case 'boolean':
            case 'number':
            case 'string':
                return plainValue;
                break;
            case 'object':
                {
                    const plainSetup = plainValue as SetupBaseInterface;

                    if (plainSetup.className) {
                        return this.createNewSetup(plainSetup, persist);
                    } else {
                        return new ObservableSetupBaseMap<SetupBase>();
                    }
                    throw new Error(
                        `ControllerImpl[${this.constructor.name}].getValue() only SetupBase and ObservableSetupBaseMap creation supported so far: ${JSON.stringify(plainValue)}`);
                }
                break;
            default:
                throw new Error(`ControllerImpl[${this.constructor.name}].getValue(${plainValue}) not supported so far: ${typeof plainValue}`);
        }
    }



    private onItemChanged(change: LocalItemChangeArgsType): void {
        const { item, name, type } = change;

        if (!(item.id != undefined && item.className != undefined && item.parentId != undefined))
            throw new Error(`ControllerImpl[${this.constructor.name}].onItemchanged(${name}, ${type} ): Invalid object: ${JSON.stringify(item)}`);

        const newValue = 'newValue' in change ? change.newValue : undefined;
        const newSetup = newValue instanceof SetupBase ? newValue as SetupBase : undefined;
        const itemPlainValue = newValue != undefined ? this.getPlainValue(newValue) : undefined;
        const remotePlainValue = this.remoteUpdates.get(item.id)?.[name];

        // console.log(`ControllerImpl[${this.constructor.name}].onItemchanged(${item.id}.${name}, ${type} ) = ${change['newValue']}`);

        if (isEqual(itemPlainValue, remotePlainValue)) {
            console.log(`ControllerImpl[${this.constructor.name}].onItemchanged(${item.id}.${name}, ${type} ) skip remoteUpdate=`, change, itemPlainValue, remotePlainValue);
        } else {
            console.log(
                `ControllerImpl[${this.constructor.name}].onItemchanged(${item.id}.${name}, ${type} )=${itemPlainValue} != ${remotePlainValue}`,
                itemPlainValue,
                remotePlainValue
            );
            this.propagate && this.propagate({
                item: item.id,
                name: change.name,
                type: change.type,
                ...(itemPlainValue != undefined ? { newValue: itemPlainValue } : undefined)
            } as IpcChangeArgsType);
            this.persist && this.persist(change);

            if (newSetup) {
                this.connectPersistPropagate({
                    item: newSetup,
                    persist: false,
                    propagate: false
                });
                this.persist && this.persist({ item: newSetup, type: 'add', name: 'id' });
            }
        }
    }

    private onMapChange = (item: string, map: string, changes: IMapDidChange<string, SetupBase | null>): void => {
        // console.log(`ControllerImpl[${this.constructor.name}].onMapChange(${item}.${map}.${changes.name} - ${changes.type})`);

        const newValue = 'newValue' in changes ? changes.newValue : undefined;
        const newSetup = newValue instanceof SetupBase ? newValue as SetupBase : undefined;
        const itemPlainValue = newValue != undefined ? this.getPlainValue(newValue) : undefined;
        const hasRemote = this.remoteUpdates.has(item) && changes.name in this.remoteUpdates.get(item)?.[map];
        const remotePlainValue = this.remoteUpdates.get(item)?.[map][changes.name];

        if (hasRemote && isEqual(itemPlainValue, remotePlainValue)) {
            console.log(
                `ControllerImpl[${this.constructor.name}].onMapChange(${item}.${map}[${changes.name}], ${changes.type} ) skip remoteUpdate=`,
                changes,
                itemPlainValue,
                remotePlainValue);
        } else {
            switch (changes.type) {
                case 'add':
                    if (newSetup != undefined) {
                        console.log(
                            `ControllerImpl[${this.constructor.name}].onMapChange(${item}.${map}[${name}], ${changes.type} ) connect, propagate and persist`,
                            changes,
                            itemPlainValue,
                            remotePlainValue
                        );
                        this.connectPersistPropagate({ item: newSetup, persist: true, propagate: true });
                        this.propagate && this.propagate({
                            item: item,
                            map: map,
                            name: changes.name,
                            type: changes.type,
                            newValue: this.getPlainValue(newSetup)
                        });
                        this.persist && this.persist({ item: newSetup, type: 'add', name: 'id' });
                    } else if (newValue) {
                        console.error(
                            `ControllerImpl[${this.constructor.name}].onMapChange(${item}.${map}[${name}], ${changes.type} ) skip undefined newSetup but newValue is defined`,
                            changes,
                            itemPlainValue,
                            remotePlainValue
                        );
                    } else {
                        console.log(
                            `ControllerImpl[${this.constructor.name}].onMapChange(${item}.${map}[${name}], ${changes.type} ) skip null`, changes, itemPlainValue, remotePlainValue);
                    }
                    break;
                case 'update':
                    if ((changes.oldValue == null) && (changes.newValue != null)) {
                        console.log(`ControllerImpl[${this.constructor.name}].onMapChange(${item}.${map}.${changes.name}) ignore overwriting null`);
                        return;
                    }
                    console.log(`ControllerImpl[${this.constructor.name}].onMapChange(${item}.${map}.${changes.name}, ${changes.type})`);
                    this.propagate && this.propagate({
                        item: item,
                        map: map,
                        name: changes.name,
                        type: changes.type,
                        newValue: changes.newValue == null ? null : changes.newValue.getShallow()
                    });
                    break;
                case 'delete':
                    console.log(`ControllerImpl[${this.constructor.name}].onMapChange(${item}.${map}.${changes.name}, ${changes.type}) propagate delete`);
                    this.propagate && this.propagate({
                        item: item,
                        map: map,
                        name: changes.name,
                        type: changes.type
                    });
                    break;
            }
        }
    }

    protected abstract getSetupImpl(id: string, depth: number): Promise<SetupBase>;

    protected readonly propagate: ((update: IpcChangeArgsType) => void) | undefined;

    protected persist: ((data: LocalChangeArgs) => void) | undefined;

    private remoteUpdates: Map<string, SetupBaseInterface> = new Map<string, SetupBaseInterface>();

    private addRemoteUpdate(update: IpcChangeArgsType): boolean {

        const mapUpdate = (update as IpcMapChangeArgs).map ? (update as IpcMapChangeArgs) : undefined;
        const newItem = !this.remoteUpdates.has(update.item);
        if (newItem) {
            const item = this.configs.get(update.item);

            if (!item) {
                console.error(
                    `ControllerImpl[${this.constructor.name}].addRemoteUpdate(${update.item}.${update.name}, ${update.type}) = ${update['newValue']}: not found in this.configs`
                );
                throw new Error(
                    `ControllerImpl[${this.constructor.name}].addRemoteUpdate(${update.item}.${update.name}, ${update.type}) = ${update['newValue']}: not found in this.configs`
                );
            }

            this.remoteUpdates.set(
                update.item,
                item.getShallow()
            );
        }

        const remoteItem = mapUpdate ? this.remoteUpdates.get(update.item)?.[mapUpdate.map] : this.remoteUpdates.get(update.item);

        if (remoteItem) {

            if ((!newItem) && isEqual(remoteItem[update.name], update['newValue'])) {
                console.warn(`ControllerImpl[${this.constructor.name}].addRemoteUpdate(${update.item}.${update.name}, ${update.type}) already = ${update['newValue']}`);
                return false;
            }
            // console.log(`ControllerImpl[${this.constructor.name}].addRemoteUpdate(${update.item}.${update.name}, ${update.type}) = ${update['newValue']} newItem=${newItem}`);

            switch (update.type) {
                case 'add':
                case 'update':
                    console.log(`ControllerImpl[${this.constructor.name}].addRemoteUpdate(${update.item}.${update.name}, ${update.type}) = ${update.newValue} newItem=${newItem}`);
                    remoteItem[update.name] = update.newValue;
                    break;
                case 'remove':
                    console.log(`ControllerImpl[${this.constructor.name}].addRemoteUpdate(${update.item}.${update.name}, ${update.type}) = undefined/remove`);
                    remoteItem[update.name] = undefined;
                    // delete remoteItem[update.name];
                    break;
                case 'delete':
                    if (!mapUpdate)
                        throw new Error(`ControllerImpl[${this.constructor.name}].addRemoteUpdate(${update.item}.${update.name}, ${update.type}) = no map`);
                    console.log(`ControllerImpl[${this.constructor.name}].addRemoteUpdate(${update.item}.${mapUpdate.map}.${update.name}, ${update.type}) = undefined/delete`);
                    remoteItem[update.name] = undefined;
                    // delete (remoteItem[mapUpdate.map] as ObservableSetupBaseMap<SetupBase>).delete(update.name);
                    break;
            }
        } else {
            throw new Error(
                `ControllerImpl[${this.constructor.name}].addRemoteUpdate(${update.item}.${update.name}, ${update.type}) = ${update['newValue']}: no remote item, isNew=${newItem}`
            );
        }
        return true;
    }



    createNewSetup(plain: SetupBaseInterface, persist: boolean): SetupBase {
        const newSetup = create(plain);
        this.connectPersistPropagate({ item: newSetup, persist: persist, propagate: false });
        return newSetup;
    }

    async onSetupChanged(e: Event, update: IpcChangeArgsType, persist?: boolean): Promise<void> {
        const sender = (e as IpcMainEvent).sender ? (e as IpcMainEvent).sender.id : ((e as IpcRendererEvent).senderId ? (e as IpcRendererEvent).senderId : '?');

        console.log(
            `ControllerImpl[${this.constructor.name}].onSetupChanged(${sender}, ${update.item}.${update['map']}.${update.name}` +
            ` ${update.type} = ${update['newValue']}, persist=${persist}) hasItem=${this.configs.has(update.item)}`
        );

        if ( /* (process.type != 'browser') && */ (!this.configs.has(update.item))) {
            console.error(
                `ControllerImpl[${this.constructor.name}].onSetupChanged(${sender}, ${update.item}.${update['map']}.${update.name}` +
                ` ${update.type} = ${update['newValue']}, persist=${persist}) hasItem=-> ${this.configs.has(update.item)} <- proces.type=-> ${process.type} <-`
            );
        }

        const localItem =
            this.configs.get(update.item) ??
            await this.getSetup(update.item, 0);
        const map = (update as IpcMapChangeArgs).map ? (update as IpcMapChangeArgs).map : undefined;

        if (this.addRemoteUpdate(update)) {
            if (map) {
                const localMap = localItem[map] as ObservableSetupBaseMap<SetupBase>;

                switch (update.type) {
                    case 'add':
                    case 'update':
                        if (update.newValue == null) {
                            console.log(`ControllerImpl[${this.constructor.name}].onSetupChanged(${update.item}.${map}.${update.name}, ${update.type}) = ${update.newValue}`);
                            localMap.set(
                                update.name,
                                null
                            );
                        } else if (typeof update.newValue == 'object') {
                            console.log(`ControllerImpl[${this.constructor.name}].onSetupChanged(${update.item}.${map}.${update.name}, ${update.type}) = ${update.newValue}`);
                            localMap.set(
                                update.name,
                                update.newValue == null ? null :
                                    this.createNewSetup(update.newValue as SetupBaseInterface, persist == true)
                            );
                        } else
                            throw new Error(
                                `ControllerImpl[${this.constructor.name}].onSetupChanged(${update.item}.${map}.${update.name}, ${update.type})` +
                                ` only SetupItem supported ${JSON.stringify(update.newValue)}`);

                        break;
                    case 'delete':
                        console.log(`ControllerImpl[${this.constructor.name}].onSetupChanged(${update.item}.${map}.${update.name}, ${update.type}) = undefined/delete`);
                        localMap.delete(update.name);
                        break;
                }
            } else {
                switch (update.type) {
                    case 'add':
                    case 'update':
                        console.log(`ControllerImpl[${this.constructor.name}].onSetupChanged(${update.item}.${update.name}, ${update.type}) = ${update.newValue}`);
                        if (update.newValue == null)
                            throw new Error(`ControllerImpl[${this.constructor.name}].onSetupChanged(${update.item}.${update.name}, ${update.type}) = ${update.newValue}`);
                        localItem[update.name] = this.getValue(update.newValue, persist == true);
                        break;
                    case 'remove':
                        console.log(`ControllerImpl[${this.constructor.name}].onSetupChanged(${update.item}.${update.name}, ${update.type}) = undefined/delete`);
                        // remoteItem[update.name] = undefined;
                        delete localItem[update.name];
                        break;
                }
            }
        } else {
            console.warn(
                `ControllerImpl[${this.constructor.name}].onSetupChanged(${sender}, ${update.item}.${update['map']}.${update.name}, ${update.type})` +
                ` ==? ${update['newValue']} skip remote update`);
        }

        persist && this.persist && this.persist({
            item: localItem,
            name: update.name,
            type: update.type,
            ...(map ? { map } : undefined),
            ...((update.type == 'add' || update.type == 'update') ? { newValue: update.newValue } : undefined)
        });
    }
}


class Renderer extends ControllerImpl {
    protected ipc: IpcRenderer = electronIpcRenderer;

    private windowId: number;

    constructor() {
        super();

        this.windowId = remote.getCurrentWindow().id;

        // console.log(`${this.constructor.name}() ${this.windowId}`);

        this.ipc.on('change', (...args) => this.onSetupChanged(...args));
    }

    protected loadChildren(item: SetupBase, depth: number): void {
        if (depth != 0) {
            for (const [propertyName, value] of Object.entries(item)) {
                if (value instanceof ObservableSetupBaseMap) {
                    console.log(`${this.constructor.name}.loadChildren(${item.id}, ${depth}): get children in ${propertyName}`);
                    const container = value as ObservableSetupBaseMap<SetupBase>;
                    for (const itemId of container.keys()) {
                        container.set(
                            itemId,
                            this.getSetupSync(itemId, depth - 1)
                        );
                    }
                } else if (value instanceof SetupBase) {
                    console.log(`${this.constructor.name}.loadChildren(${item.id}, ${depth}): load children in ${propertyName}`);
                    this.loadChildren(value as SetupBase, depth);
                } else {
                    // console.log(`${this.constructor.name}.getSetupSync(${id}): don't add children in ${propertyName} as not ObservableSetupBaseMap`);
                }
            }
        }
    }

    protected getSetupSync(id: string, depth: number): SetupBase {

        const responseItem: SetupBase = this.configs.get(id) ?? this.load(id);

        this.loadChildren(responseItem, depth);

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
            this.ipc.send('register', { itemId: item.id, depth: depth });
        }
    }

    protected async getSetupImpl(id: string, depth: number): Promise<SetupBase> {
        const item = this.getSetupSync(id, depth);

        this.registerWithMain(item, depth);

        return item;
    }

    private resolveLinks = (item: SetupBaseInterface): void => {
        console.log(`${this.constructor.name}.resolveLinks(${item.id})`);

        for (const [propertyName, value] of Object.entries(item)) {
            if (typeof value == 'object' && ((value as SetupLinkInterface).id)) {
                console.log(`${this.constructor.name}.resolveLinks(${item.id}): resolve ${propertyName} - ${(value as SetupLinkInterface).id}`);
                item[propertyName] = this.loadPlain((value as SetupLinkInterface).id);
                this.resolveLinks(item[propertyName]);
            }
        }
    }

    private loadPlain = (id: SetupItemId): SetupBaseInterface => {
        const itemString = localStorage.getItem(id);

        if (!itemString)
            throw new Error(`${this.constructor.name}.loadPlain(): can't load/find ${id}`);

        try {
            return JSON.parse(itemString);
        } catch (error) {
            console.error(`${this.constructor.name}: loadPlain(${id}): caught ${error} parsing ${itemString}`, error);
            throw error;
        }

    }

    private load(id: string): SetupBase {
        // console.log(`${this.constructor.name}: load(${id})`);
        console.log(`${this.constructor.name}: load(${id})` /*: ${itemString}`*/);
        let item: SetupBase;

        try {
            const itemPlain = this.loadPlain(id);

            this.resolveLinks(itemPlain);

            item = create(itemPlain);
        } catch (error) {

            if (id == Root.name) {
                item = Root.createNewBlank();
                console.warn(`${this.constructor.name}: load(${id}): new Blank`, item);
                this.persist({ item: item, type: 'add', name: 'id' });
            } else if (id == Screen.name) {
                item = Screen.createNewBlank();
                console.warn(`${this.constructor.name}: load(${id}): new Blank`, item);
                this.persist({ item: item, type: 'add', name: 'id' });
            } else
                throw new Error(`${this.constructor.name}: load(-> ${id} <-): not found`);
        }
        return item;
    }

    protected readonly propagate = (update: IpcChangeArgsType): void => {
        console.log(`${this.constructor.name}.propapgate(${update.item}, ${update.name}, ${update.type}) send to main`/*, item*/);
        this.ipc.send('change', update);
    }


    protected persist = ({ item }: LocalChangeArgs): void => {
        console.log(`${this.constructor.name}.persist(${item.id})`/*, item*/);
        const shallow = item.getShallow();

        ControllerImpl.createLinks(shallow);

        localStorage.setItem(item.id, JSON.stringify(shallow));
    }
}


type Size = { width: number; height: number };
type SizeCallback = (size: Size) => void;

/**
 * Renderer Config Controller for Wallpaper Browsers. Deal with size
 */
export class Paper extends Renderer {
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

        console.log(`${this.constructor.name}[${this.browserId}]()`, process.argv);
    }

    async getBrowser(): Promise<Browser> {
        if (!this.browser) {
            this.browser = await this.getSetup(this.browserId, -1) as Browser;

            console.log(
                `${this.constructor.name}[${this.browserId}](): got Browser (${this.browser.plugins.size}):` +
                ` width=${this.browser.relative.width}/${this.browser.scaled?.width}/${this.browser.device?.width}` +
                ` height=${this.browser.relative.height}/${this.browser.scaled?.height}/${this.browser.device?.height}`,
                this.browser
            );
        }
        return this.browser;
    }
}


class MainWindow extends Renderer {

    constructor() {
        super();

        // console.log(`${this.constructor.name}()`, process.argv);

        this.getSetup(Root.name, -1).then(root => {

            this.ipc.send(
                'init',
                {
                    schema: SetupBase.activeSchema,
                    root: root.getDeep()
                }
            );
        });
    }
}


interface ChangeListener {
    senderId: number;
    ipc: IpcWindow;
    itemId: SetupItemId;
    depth: number;
    disposers: (() => void)[];
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

        this.ipc.on('change', (...args) => this.onSetupChanged(...args));
        this.ipc.on('register', this.onRegister);
    }

    senderUpdatesOld = new Map<number, Map<SetupItemId, Map<PropertyKey, InterfacePropertyType>>>();
    senderUpdates = new Array<{}>();

    static updateKey = (itemID: string, name: string, map?: string): string => `${itemID}.${map ? map + '.' : ''}${name}`;

    async onSetupChanged(e: Event, update: IpcChangeArgsType, persist?: boolean): Promise<void> {
        const mainEvent = e as IpcMainEvent;
        const updateKey = Main.updateKey(update.item, update.name, (update as IpcMapChangeArgs).map);

        const senderUpdates = this.senderUpdates[mainEvent.sender.id];
        if (!senderUpdates)
            throw new Error(`${this.constructor.name}.onSetupChanged(${mainEvent.sender.id} doesn't exist in senderUpdates ${Array.from(this.senderUpdates.keys())})`);

        console.log(`${this.constructor.name}.onSetupChanged() [${mainEvent.sender.id}][${updateKey}] = `, update['newValue']);

        senderUpdates[updateKey] = update['newValue'];

        super.onSetupChanged(e, update, persist);
    }


    private onRegister = (e: IpcMainEvent, { itemId, depth }: IpcRegisterArgs): void => {
        const senderId = e.sender.id;

        console.log(`${this.constructor.name}.onRegister[${this.changeListeners.length}]` +
            `(senderId=${senderId}, ${itemId}, d=${depth})`);

        const listener: ChangeListener = {
            senderId,
            ipc: e.sender,
            itemId,
            depth,
            disposers: new Array<(() => void)>()
        };

        this.changeListeners.push(listener);

        if (this.senderUpdates[senderId] == undefined) {
            this.senderUpdates[senderId] = {};
        }

        this.connectChangeListenerToExisting(listener);
    }

    connectChangeListenerToExisting(listener: ChangeListener, item?: SetupBase, depth?: number): void {

        item = item ?? this.configs.get(listener.itemId);
        depth = depth ?? 0;

        if (!item)
            throw new Error(`${this.constructor.name}.connectChangeListenerToExisting([${listener.senderId},${listener.itemId},${listener.depth}] @ ${depth}`);

        this.connectChangeListener(item, listener, false, depth);

        for (const value of Object.values(item)) {
            if (((listener.depth == -1) || (depth < listener.depth)) && (value instanceof ObservableSetupBaseMap)) {
                // console.log(
                //     `${this.constructor.name}.connectChangeListenerToExisting[${listener.senderId},${listener.itemId},${listener.depth}]:` +
                //     ` observe ${item.id}.${propertyName} as ObservableSetupBaseMap`);

                for (const child of value.values()) {
                    if (child)
                        this.connectChangeListenerToExisting(listener, child, depth + 1);
                }

            } else if (value instanceof SetupBase) {
                // console.log(
                //     `[${this.constructor.name}].connectChangeListenerToExisting[${listener.senderId},${listener.itemId},${listener.depth}]: observe ${item.id}.${propertyName}`);
                this.connectChangeListenerToExisting(listener, value, depth);
            } else {
                // console.log(
                //     `${this.constructor.name}.connectChangeListenerToExisting[${listener.senderId},${listener.itemId},${listener.depth}]: ignore ${propertyName}.${item.id}`);
            }
        }
    }

    private connectChangeListener(item: SetupBase, listener: ChangeListener, fireImmediately: boolean, offset = 0): void {
        console.log(`${this.constructor.name}.connectChangeListener[${listener.senderId},${listener.itemId},${listener.depth}] ${item.id} @${listener.depth - offset}`);

        for (const [propertyName, value] of Object.entries(item)) {
            if (value instanceof ObservableSetupBaseMap) {
                // console.log(
                //     `${this.constructor.name}.connectChangeListener[${listener.senderId},${listener.itemId},${listener.depth}]:` +
                //     ` observe ${item.id}.${propertyName} as ObservableSetupBaseMap`);
                listener.disposers.push(
                    (value as ObservableSetupBaseMap<SetupBase>)
                        .observe((changes: IMapDidChange<string, SetupBase | null>) => {
                            if ((changes.type == 'update') && (changes.oldValue == null) && (changes.newValue != null)) {
                                console.log(
                                    `[${this.constructor.name}].connectChangeListener[${listener.senderId},${listener.itemId},${listener.depth}]` +
                                    ` (${item.id}.${propertyName}.${changes.name}) ignore overwriting null`);
                                return;
                            }
                            // console.log(
                            //     `[${this.constructor.name}].connectChangeListener[${listener.senderId},${listener.itemId},${listener.depth}]` +
                            //     ` ${item.id}.${propertyName}.${changes.name}, ${changes.type})`);
                            this.onChangeItemChanged(
                                listener,
                                {
                                    item: item,
                                    map: propertyName,
                                    name: changes.name,
                                    type: changes.type,
                                    ...((changes.type == 'add' || changes.type == 'update') ? { newValue: changes.newValue } : undefined)
                                } as LocalChangeArgsType
                            );
                        })
                );
            } else if (isObservableProp(item, propertyName)) {
                // console.log(`[${this.constructor.name}].connectChangeListener[${listener.senderId},${listener.itemId},${listener.depth}]: observe ${item.id}.${propertyName}`);

                listener.disposers.push(
                    reaction(
                        () => item[propertyName],
                        newValue => this.onChangeItemChanged(listener, { item, name: propertyName, type: 'update', newValue }),
                        {
                            fireImmediately: fireImmediately,
                            name: `ChangeListener[${listener.senderId}, ${listener.itemId}, ${listener.depth}] @ ${item.id}.${propertyName} @${offset}`
                        }
                    )
                );
            } else {
                // console.log(`${this.constructor.name}.connectChangeListener[${listener.senderId},${listener.itemId},${listener.depth}]: ignore ${propertyName}.${item.id}`);
            }
        }
    }

    private onChangeItemChanged = (listener: ChangeListener, change: LocalChangeArgsType): void => {
        const { item } = change;

        if (!(item.id != undefined && item.className != undefined && item.parentId != undefined))
            throw new Error(
                `${this.constructor.name}.onChangeItemChanged(${change.name}, ${change.type} ): Invalid object: ${JSON.stringify(item)}`);

        const map = (change as LocalMapArgs).map;
        const updateKey = Main.updateKey(item.id, change.name, map);
        const senderUpdates = this.senderUpdates[listener.senderId];
        const hasUpdate = updateKey in senderUpdates;
        const update = senderUpdates[updateKey];
        const plainNew = change['newValue'] == undefined ? undefined : this.getPlainValue(change['newValue']);
        let skipChange = false;

        // console.log(
        //     `${this.constructor.name}.onChangeItemChanged([${listener.senderId}, ${listener.itemId}, ${listener.depth}]` +
        //     ` @ ${item.id}.${map}.${change.name}, ${change.type}) = ${change['newValue']}`);

        if (hasUpdate) {
            skipChange = isEqual(update, plainNew);

            if (skipChange)
                console.log(
                    `${this.constructor.name}.onChangeItemChanged([${listener.senderId}, ${listener.itemId}, ${listener.depth}]` +
                    ` @ ${item.id}.${map}.${change.name}, ${change.type}) skip received [${listener.senderId}][${updateKey}]`,
                    change['newValue']
                );
            else
                console.log(
                    `${this.constructor.name}.onChangeItemChanged([${listener.senderId}, ${listener.itemId}, ${listener.depth}]` +
                    ` @ ${item.id}.${map}.${change.name}, ${change.type}) send newer [${listener.senderId}][${updateKey}]`,
                    update,
                    change['newValue']
                );

            delete senderUpdates[updateKey];
        } else
            console.log(
                `${this.constructor.name}.onChangeItemChanged([${listener.senderId}, ${listener.itemId}, ${listener.depth}]` +
                ` @ ${item.id}.${map}.${change.name}, ${change.type}) send `,
                change['newValue']
            );

        if (!skipChange) {
            listener.ipc.send(
                'change',
                {
                    item: item.id,
                    type: change.type,
                    name: change.name,
                    ...(map ? { map } : undefined),
                    ...((change.type == 'add' || change.type == 'update') ? { newValue: change.newValue } : undefined)
                } as IpcChangeArgsType,
                false
            );
        }
    }


    private connectChangeListeners(item: SetupBase, fireImmediately: boolean): void {
        // console.log(`${this.constructor.name}.connectChangeListeners[${this.changeListeners.length}](${item.id},${fireImmediately})`);
        for (const listener of this.changeListeners) {
            /// Check if ancestor in within depth is listening
            for (
                let offset = 0, ancestor: SetupBase | undefined = item;
                ((listener.depth == -1) || (offset <= listener.depth)) && (ancestor);
                offset += 1, ancestor = this.configs.get(ancestor.parentId)
            ) {
                if (listener.itemId == ancestor.id) {
                    this.connectChangeListener(item, listener, fireImmediately, offset);
                    break;
                }
            }
        }
    }

    protected onItemConnected = (item: SetupBase, fireImmediately: boolean): void => {
        console.log(`${this.constructor.name}.onItemConnected(${item.id}) fireImmediately=${fireImmediately}`);
        this.connectChangeListeners(item, fireImmediately);
    }


    private onInit = (e: IpcMainEvent, init: IpcInitArgs): void => {
        const { schema, root: rootPlain } = init;

        console.log(`${this.constructor.name}.onInit: sender=${e.sender}`);


        if (!schema.definitions)
            throw new Error(`${this.constructor.name}.onInit: no schema.definitions sender=${e.sender}`);

        Object.values(schema.definitions)
            .filter(schemaDef =>
                (schemaDef as JSONSchema7).allOf?.some(pluginRefProspect =>
                    (pluginRefProspect as JSONSchema7).$ref == Plugin.name))
            .forEach(definition =>
                Plugin.add(definition as JSONSchema7));

        const root = create(rootPlain);

        this.connectPersistPropagate({ item: root, persist: false, propagate: false });

        this.resolvePromises();

        this.ipcStorage = e.sender;

        //this.ipcStorage.send('getschema');
        //this.requestPromises();
    }

    private resolvePromises = (): void => {
        console.log(`${this.constructor.name}.resolvePromises[${this.promises.length}]`);

        for (const promise of this.promises) {
            const item = this.configs.get(promise.id);

            if (!item) {
                console.error(`${this.constructor.name}.resolvePromises() can't resolve ${promise.id}`);
                promise.reject(`${this.constructor.name}.resolvePromises() can't resolve ${promise.id}`);
            } else {
                console.log(`${this.constructor.name}.resolvePromises( ${promise.id}, ${promise.depth} )`);
                promise.resolve(item);
            }
        }
        this.promises.length = 0;
    }

    protected getSetupImpl(id: string, depth: number): Promise<SetupBase> {
        return new Promise(
            (resolve, reject) => {
                const responseItem: SetupBase | undefined = this.configs.get(id);

                if (!responseItem) {
                    this.promises.push({ id: id, depth: depth, resolve: resolve, reject: reject });

                    if (this.ipcStorage) {
                        console.error(`${this.constructor.name}.getSetupImpl(${id}, ${depth}): doesn't exist promises=${this.promises.length}`);
                    } else {
                        console.log(`${this.constructor.name}.getSetupImpl(${id}, ${depth}): wait for init promises=${this.promises.length}`);
                    }
                } else {
                    console.log(`${this.constructor.name}.getSetupImpl(${id}, ${depth}): resolve` /*, responseItem.getPlainDeep() */);
                    resolve(responseItem);
                }
                return responseItem;
            });
    }

    // protected readonly propagate = (update: IpcChangeArgsType): void => {
    //     console.log(`${this.constructor.name}.propapgate(${item.id})`, item);
    // }

    protected persist = (change: LocalChangeArgs): void => {
        console.log(`${this.constructor.name}.persist(${change.item.id},${change.name},${change.type}) ipc=${this.ipcStorage}`/*, item*/);

        // persist && this.persist && this.persist({
        //     item: localItem,
        //     name: update.name,
        //     type: update.type,
        //     ...(map ? { map } : undefined),
        //     ...((update.type == 'add' || update.type == 'update') ? { newValue: update.newValue } : undefined)
        // });

        this.ipcStorage?.send(
            'change',
            {
                item: change.item.id,
                name: change.name,
                type: change.type,
                ...((change as LocalMapArgs).map ? { map: (change as LocalMapArgs).map } : undefined),
                ...((change as LocalItemAddArgs | LocalItemUpdateArgs | LocalMapAddArgs | LocalMapUpdateArgs).newValue ?
                    {
                        newValue: (change as LocalMapAddArgs | LocalMapUpdateArgs).newValue == null ?
                            null : this.getPlainValue((change as LocalItemAddArgs | LocalItemUpdateArgs).newValue)
                    } :
                    undefined)
            } as IpcChangeArgsType,
            true);
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

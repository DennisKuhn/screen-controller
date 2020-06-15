import { isObservableProp, intercept, ObservableMap, IMapWillChange, IValueWillChange } from 'mobx';
import { EventEmitter } from 'events';
import { IpcRendererEvent, IpcMainEvent } from 'electron';
import { isEqual, cloneDeep } from 'lodash';
import { SetupBase, PropertyType as ObjectPropertyType } from '../SetupBase';
import { SetupBaseInterface, PropertyType as InterfacePropertyType } from '../SetupInterface';
import { create } from '../SetupFactory';
import { ObservableSetupBaseMap } from '../Container';
import { IpcChangeArgsType, IpcMapChangeArgs } from '../IpcInterface';



export declare interface Controller {
    /**
    *
    * @param id
    * @param depth 0=do not resolve children, -1 resolve all descendants, <n> resolve n-levels of decendants
    */
    getSetup(id: string, depth: number): Promise<SetupBase>;

    tryGetSetupSync: (id: string, depth: number) => SetupBase | undefined;

    log(): void;
}

export interface SetupPromise {
    id: string;
    depth: number;
    resolve: (setup: SetupBase) => void;
    reject: (reason: string) => void;
}



interface ConnectItemArgs {
    item: SetupBase;
}

export interface LocalChangeArgs {
    item: SetupBase;
    name: string;
    type: 'add' | 'update' | 'remove' | 'delete';
}

export interface LocalItemUpdateArgs extends LocalChangeArgs {
    type: 'update';
    newValue: ObjectPropertyType;
    oldValue: ObjectPropertyType;
}

export interface LocalItemAddArgs extends LocalChangeArgs {
    type: 'add';
    newValue: ObjectPropertyType;
}

export interface LocalItemRemoveArgs extends LocalChangeArgs {
    type: 'remove';
}

export interface LocalMapArgs extends LocalChangeArgs {
    map: string;
}

export interface LocalMapDeleteArgs extends LocalMapArgs {
    type: 'delete';
}

export interface LocalMapAddArgs extends LocalMapArgs {
    type: 'add';
    newValue: SetupBase | null;
}

export interface LocalMapUpdateArgs extends LocalMapArgs {
    type: 'update';
    newValue: SetupBase | null;
}

// type LocalChangeArgsType = LocalItemUpdateArgs | LocalItemAddArgs | LocalItemRemoveArgs | LocalMapAddArgs | LocalMapUpdateArgs | LocalMapDeleteArgs;
export type LocalItemChangeArgsType = LocalItemUpdateArgs | LocalItemAddArgs | LocalItemRemoveArgs;
export type LocalMapChangeArgsType = LocalMapUpdateArgs | LocalMapAddArgs | LocalMapDeleteArgs;
export type LocalChangeArgsType = LocalItemChangeArgsType | LocalMapChangeArgsType;

/**
 */
export abstract class ControllerImpl extends EventEmitter implements Controller {
    protected configs: Map<string, SetupBase> = new Map<string, SetupBase>();

    protected constructor() {
        super();
        // console.log(`ControllerImpl[${this.constructor.name}]`);
    }

    log(): void {
        //TODO
        console.log(`ControllerImpl[${this.constructor.name}].log() REMOVE ME`);
    }

    setupPromises: SetupPromise[] = new Array<SetupPromise>();

    private test(item: SetupBase, depth: number): boolean {
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

    protected tryGetItem(id: string, depth: number): SetupBase | undefined {
        const responseItem: SetupBase | undefined = this.configs.get(id);

        if (responseItem && this.test(responseItem, depth)) {
            return responseItem;
        }
        return undefined;
    }

    protected onCached: ((item: SetupBase, depth: number) => void) | undefined;

    public tryGetSetupSync = (id: string, depth: number): SetupBase | undefined => {
        const responseItem = this.tryGetItem(id, depth);

        if (responseItem) {
            // console.log(`ControllerImpl[${this.constructor.name}].trySetupSync(${id}, ${depth}) resolve now - promises=${this.setupPromises.length}`, responseItem);
            if (this.onCached)
                this.onCached(responseItem, depth);
        }
        return responseItem;
    }

    getSetup(id: string, depth: number): Promise<SetupBase> {
        // console.log(`ControllerImpl[${this.constructor.name}].getSetup(${id}, ${depth})`);

        return new Promise(
            (resolve: (setup: SetupBase) => void, reject: (reason: string) => void) => {

                const responseItem = this.tryGetSetupSync(id, depth);

                if (responseItem) {
                    // console.log(`ControllerImpl[${this.constructor.name}].getSetup(${id}, ${depth}) resolve now - promises=${this.setupPromises.length}`, responseItem);
                    resolve(responseItem);
                } else {
                    if (this.setupPromises.push({ resolve: resolve, reject: reject, id: id, depth: depth }) == 1) {
                        // console.log(`ControllerImpl[${this.constructor.name}].getSetup(${id}, ${depth}) process now - promises=${this.setupPromises.length}`);
                        this.processPromise();
                    } else {
                        // console.log(`ControllerImpl[${this.constructor.name}].getSetup(${id}, ${depth}) wait - promises=${this.setupPromises.length}`);
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

            // console.log(`ControllerImpl[${this.constructor.name}].processPromise(${id}, ${depth}) 1/${this.setupPromises.length} ...`);

            const tree = await this.getTree(id, depth);
            this.connectPersistPropagate({ item: tree });

            // console.log(`ControllerImpl[${this.constructor.name}].processPromise(${id}, ${depth}) ... resolve 1/${this.setupPromises.length}`, tree);
            resolve(tree);
            this.setupPromises.splice(0, 1);

        } while (this.setupPromises.length);
    }

    protected onItemConnected: ((item: SetupBase) => void) | undefined;


    protected connectPersistPropagate(args: ConnectItemArgs): void {
        const { item } = args;

        if (!this.configs.has(item.id)) {
            console.log(
                `ControllerImpl[${this.constructor.name}].connectPersistPropagate( ${item.className}[${item.id}],`
            );

            this.configs.set(item.id, item);

            for (const [propertyName, value] of Object.entries(item)) {
                if (value instanceof ObservableSetupBaseMap) {
                    // console.log(`ControllerImpl[${this.constructor.name}].connectPersistPropagate(${item.id}): observe ${propertyName} as ObservableSetupBaseMap`);
                    intercept(
                        value as ObservableMap,
                        (changes: IMapWillChange<string, SetupBase | null>) => {
                            this.onMapChange({ ...changes, item, map: propertyName } as LocalMapChangeArgsType);
                            return changes;
                        }
                    );
                } else if (isObservableProp(item, propertyName)) {
                    // console.log(`ControllerImpl[${this.constructor.name}].connectPersistPropagate(${item.id}): observe ${propertyName}` );
                    intercept(
                        item,
                        propertyName as any,
                        (change: IValueWillChange<ObjectPropertyType>) => {
                            this.onItemChanged({ item, name: propertyName, type: change.type, newValue: change.newValue, oldValue: item[propertyName] });
                            return change;
                        }
                    );
                } else {
                    // console.log(`ControllerImpl[${this.constructor.name}].connectPersistPropagate(${item.id}): ignore ${propertyName}`);
                }
            }

            if (this.onItemConnected) {
                this.onItemConnected(item);
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
                        this.connectPersistPropagate({ ...args, item: child });
                    }
                }
            } else if (value instanceof SetupBase) {
                this.connectPersistPropagate({ ...args, item: value });
            } else {
                // console.log(`ControllerImpl[${this.constructor.name}].connectPersistPropagate(${item.id}): not connect children ${propertyName} as not ObservableSetupBaseMap`);
            }
        }
    }


    getValue = (plainValue: InterfacePropertyType): ObjectPropertyType => {
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
                        return this.createNewSetup(plainSetup);
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
        const itemPlainValue = newValue != undefined ? SetupBase.getPlainValue(newValue) : undefined;
        const remotePlainValue = this.remoteUpdates.get(item.id)?.[name];

        // console.log(`ControllerImpl[${this.constructor.name}].onItemchanged(${item.id}.${name}, ${type} ) = ${change['newValue']}`);

        if (isEqual(itemPlainValue, remotePlainValue)) {
            console.log(`ControllerImpl[${this.constructor.name}].onItemchanged(${item.id}.${name}, ${type} ) skip remoteUpdate=${remotePlainValue}`);
        } else {
            console.log(
                `ControllerImpl[${this.constructor.name}].onItemchanged(${item.id}.${name}, ${type} )=${JSON.stringify(itemPlainValue)} != ${JSON.stringify(remotePlainValue)}`);
            
            const ipcChange = {
                item: item.id,
                name: change.name,
                type: change.type,
                ...(itemPlainValue != undefined ? { newValue: itemPlainValue } : undefined)
            } as IpcChangeArgsType;

            if (newSetup) {
                this.connectPersistPropagate({ item: newSetup });
            }
            if (this.remoteUpdates.has(change.item.id)) {
                this.addRemoteUpdate( ipcChange );
            }
            this.propagate && this.propagate(ipcChange);
            this.persist && this.persist(change);
        }
    }

    //private onMapChange = (item: string, map: string, changes: IMapDidChange<string, SetupBase | null>): void => {
    private onMapChange = (changes: LocalMapChangeArgsType): void => {
        const { item, map, name, type } = changes;
        // console.log(`ControllerImpl[${this.constructor.name}].onMapChange(${item}.${'map' in update ? update['map'] + '.' : ''}${changes.name} - ${changes.type})`);

        const newValue = changes['newValue'];
        const newSetup = newValue instanceof SetupBase ? newValue as SetupBase : undefined;
        const itemPlainValue = newValue != undefined ? SetupBase.getPlainValue(newValue) : undefined;
        const hasRemote = this.remoteUpdates.has(item.id) && name in this.remoteUpdates.get(item.id)?.[map];
        const remotePlainValue = hasRemote ? this.remoteUpdates.get(item.id)?.[map][name] : undefined;

        if (hasRemote && isEqual(itemPlainValue, remotePlainValue)) {
            console.log(`ControllerImpl[${this.constructor.name}].onMapChange(${item}.${map}[${name}], ${type} ) skip remoteUpdate ${remotePlainValue}`);
        } else {
            switch (type) {
                case 'add':
                    if (newSetup != undefined) {
                        console.log(
                            `ControllerImpl[${this.constructor.name}].onMapChange(${item}.${map}[${name}], ${type}) connect, propagate and persist ${newSetup.id}`);
                        this.connectPersistPropagate({ item: newSetup });
                        this.propagate && this.propagate({
                            item: item.id,
                            map,
                            name,
                            type,
                            newValue: newSetup.getShallow()
                        });
                        this.persist && this.persist(changes);
                    } else if (newValue) {
                        console.error(
                            `ControllerImpl[${this.constructor.name}].onMapChange(${item}.${map}[${name}], ${type} ) skip undefined newSetup but newValue is defined`,
                            changes,
                            itemPlainValue,
                            remotePlainValue
                        );
                    } else {
                        console.log(`ControllerImpl[${this.constructor.name}].onMapChange(${item}.${map}[${name}], ${type} ) skip null`);
                    }
                    break;
                case 'update':
                    console.warn(`ControllerImpl[${this.constructor.name}].onMapChange(${item}.${map}[${name}], ${type}) ignore`);
                    break;
                case 'delete':
                    console.log(`ControllerImpl[${this.constructor.name}].onMapChange(${item}.${map}[${name}], ${type}) propagate and persist delete`);
                    this.propagate && this.propagate({
                        item: item.id,
                        map,
                        name,
                        type
                    });
                    this.persist && this.persist(changes);
                    break;
            }
        }
    }

    protected abstract getSetupImpl(id: string, depth: number): Promise<SetupBase>;

    protected readonly propagate: ((update: IpcChangeArgsType) => void) | undefined;

    protected persist: ((data: LocalChangeArgsType) => void) | undefined;

    protected remoteUpdates: Map<string, SetupBaseInterface> = new Map<string, SetupBaseInterface>();

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
                console.warn(`ControllerImpl[${this.constructor.name}].addRemoteUpdate(${update.item}.${update.name}, ${update.type}) already equal (old,new):`,
                    cloneDeep(remoteItem[update.name]),
                    cloneDeep(update['newValue']));
                return false;
            }
            // console.log(`ControllerImpl[${this.constructor.name}].addRemoteUpdate(${update.item}.${update.name}, ${update.type}) = ${update['newValue']} newItem=${newItem}`);

            switch (update.type) {
                case 'add':
                case 'update':
                    // console.log(
                    //     `ControllerImpl[${this.constructor.name}].addRemoteUpdate(${update.item}.${update.name}, ${update.type}) = ${update.newValue} newItem=${newItem}`);
                    remoteItem[update.name] = update.newValue;
                    break;
                case 'remove':
                    // console.log(`ControllerImpl[${this.constructor.name}].addRemoteUpdate(${update.item}.${update.name}, ${update.type}) = undefined/remove`);
                    remoteItem[update.name] = undefined;
                    // delete remoteItem[update.name];
                    break;
                case 'delete':
                    if (!mapUpdate)
                        throw new Error(`ControllerImpl[${this.constructor.name}].addRemoteUpdate(${update.item}.${update.name}, ${update.type}) = no map`);
                    // console.log(`ControllerImpl[${this.constructor.name}].addRemoteUpdate(${update.item}.${mapUpdate.map}.${update.name}, ${update.type}) = undefined/delete`);
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



    createNewSetup(plain: SetupBaseInterface): SetupBase {
        const newSetup = create(plain);
        this.connectPersistPropagate({ item: newSetup });
        return newSetup;
    }

    async onSetupChanged(e: Event, update: IpcChangeArgsType, persist?: boolean): Promise<void> {
        const sender = (e as IpcMainEvent).sender ? (e as IpcMainEvent).sender.id : ((e as IpcRendererEvent).senderId ? (e as IpcRendererEvent).senderId : '?');

        // console.log(
        //     `ControllerImpl[${this.constructor.name}].onSetupChanged(${sender}, ${update.item}.${'map' in update ? update['map'] + '.' : ''}.${update.name}` +
        //     ` ${update.type} = ${update['newValue']}, persist=${persist}) hasItem=${this.configs.has(update.item)}`
        // );

        if ( /* (process.type != 'browser') && */ (!this.configs.has(update.item))) {
            console.error(
                `ControllerImpl[${this.constructor.name}].onSetupChanged(${sender}, ${update.item}.${'map' in update ? update['map'] + '.' : ''}${update.name}` +
                ` ${update.type} = ${update['newValue']}, persist=${persist}) hasItem=-> ${this.configs.has(update.item)} <- proces.type=${process.type}`
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
                            console.log(
                                `ControllerImpl[${this.constructor.name}].onSetupChanged(${update.item}.${'map' in update ? update['map'] + '.' : ''}${update.name}, ` +
                                `${update.type}, persist=${persist}) = ${update.newValue}`);
                            localMap.set(
                                update.name,
                                null
                            );
                        } else if (typeof update.newValue == 'object') {
                            console.log(
                                `ControllerImpl[${this.constructor.name}].onSetupChanged(${update.item}.${'map' in update ? update['map'] + '.' : ''}${update.name}, ` +
                                `${update.type}, persist=${persist}) = ${update.newValue}`);
                            localMap.set(
                                update.name,
                                update.newValue == null ? null :
                                    this.createNewSetup(update.newValue as SetupBaseInterface)
                            );
                        } else
                            throw new Error(
                                `ControllerImpl[${this.constructor.name}].onSetupChanged(${update.item}.${'map' in update ? update['map'] + '.' : ''}${update.name}, ` +
                                `${update.type}) only SetupItem supported ${JSON.stringify(update.newValue)}`);

                        break;
                    case 'delete':
                        console.log(
                            `ControllerImpl[${this.constructor.name}].onSetupChanged(${update.item}.${'map' in update ? update['map'] + '.' : ''}${update.name}, ` +
                            `${update.type}, persist=${persist}) = delete`);
                        localMap.delete(update.name);
                        break;
                }
            } else {
                switch (update.type) {
                    case 'add':
                    case 'update':
                        console.log(
                            `ControllerImpl[${this.constructor.name}].onSetupChanged(${update.item}.${update.name}, ${update.type}, persist=${persist}) = ${update.newValue}`);
                        if (update.newValue == null)
                            throw new Error(
                                `ControllerImpl[${this.constructor.name}].onSetupChanged(${update.item}.${update.name}, ${update.type}, persist=${persist}) = ${update.newValue}` );
                        localItem[update.name] = this.getValue(update.newValue);
                        break;
                    case 'remove':
                        console.log(`ControllerImpl[${this.constructor.name}].onSetupChanged(${update.item}.${update.name}, ${update.type}, persist=${persist}) = delete`);
                        // remoteItem[update.name] = undefined;
                        delete localItem[update.name];
                        break;
                }
            }
        } else {
            console.warn(
                `ControllerImpl[${this.constructor.name}].onSetupChanged(${sender}, ${update.item}.${'map' in update ? update['map'] + '.' : ''}.${update.name}, ${update.type}, ` +
                `persist=${persist}) ==? ${update['newValue']} skip remote update`, cloneDeep(update));
        }

        (persist == true) && this.persist && this.persist({
            item: localItem,
            name: update.name,
            type: update.type,
            ...(map ? { map } : undefined),
            ...(('newValue' in update) ?
                { newValue: (update.newValue == null ? null : (update.newValue['id'] ? this.configs.get(update.newValue['id']) : update.newValue)) } :
                undefined),
            ...(('oldValue' in update) ?
                { oldValue: (update.oldValue == null ? null : (update.oldValue['id'] ? this.configs.get(update.oldValue['id']) : update.oldValue)) } :
                undefined)
        } as LocalChangeArgsType);
    }
}



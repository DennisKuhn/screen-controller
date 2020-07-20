import { ObservableMap, isObservableArray, IObservableArray, isObservableProp, observe, IValueDidChange, IMapDidChange, IArrayChange, IArraySplice } from 'mobx';
import { EventEmitter } from 'events';
import { IpcRendererEvent, IpcMainEvent } from 'electron';
import { isEqual } from 'lodash';
import { SetupBase, PropertyType as ObjectPropertyType } from '../SetupBase';
import { SetupBaseInterface, PropertyType as InterfacePropertyType, PropertyType } from '../SetupInterface';
import { create } from '../SetupFactory';
import { ObservableSetupBaseMap, SetupBaseInterfaceDictionary } from '../Container';
import { IpcChangeArgsType, IpcArrayChangeArgsType, IpcMapChangeArgsType, IpcItemChangeArgsType, getIpcArgsLog, IpcArrayUpdateArgs, IpcArraySpliceArgs } from './IpcInterface';
import { callerAndfName } from '../../utils/debugging';
import { Root } from '../Application/Root';
import { getLocalChangeArgsLog } from '../Tools';

import '../Default/Time';
import '../Default/Gradient';
import '../Default/Rectangle';
import '../Default/RelativeRectangle';
import '../Application/Plugin';
import '../Application/Browser';
import '../Application/Display';
import '../Application/Screen';
import '../Application/Root';


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
    type: 'add' | 'update' | 'remove' | 'delete' | 'splice';
}

export interface LocalItemArgs extends LocalChangeArgs {
    name: string;
}

export interface LocalItemUpdateArgs extends LocalItemArgs {
    type: 'update';
    newValue: ObjectPropertyType;
    oldValue: ObjectPropertyType | undefined;
}

export interface LocalItemAddArgs extends LocalItemArgs {
    type: 'add';
    newValue: ObjectPropertyType;
}

export interface LocalItemRemoveArgs extends LocalItemArgs {
    type: 'remove';
}

export interface LocalMapArgs extends LocalChangeArgs {
    map: string;
    name: string;
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

export interface LocalArrayArgs extends LocalChangeArgs {
    array: string;
    index: number;
}

export interface LocalArrayUpdateArgs extends LocalArrayArgs {
    type: 'update';
    newValue: ObjectPropertyType;
}

export interface LocalArraySpliceArgs extends LocalArrayArgs {
    type: 'splice';
    added: ObjectPropertyType[];
    removedCount: number;
}



// type LocalChangeArgsType = LocalItemUpdateArgs | LocalItemAddArgs | LocalItemRemoveArgs | LocalMapAddArgs | LocalMapUpdateArgs | LocalMapDeleteArgs;
export type LocalItemChangeArgsType = LocalItemUpdateArgs | LocalItemAddArgs | LocalItemRemoveArgs;
export type LocalMapChangeArgsType = LocalMapUpdateArgs | LocalMapAddArgs | LocalMapDeleteArgs;
export type LocalArrayChangeArgsType = LocalArrayUpdateArgs | LocalArraySpliceArgs;
export type LocalChangeArgsType = LocalItemChangeArgsType | LocalMapChangeArgsType | LocalArrayChangeArgsType;

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
            for (const propertyName of Object.keys(item.properties)) {
                const value = item[propertyName];
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
                } else if (typeof value == 'object' && value instanceof SetupBase) {
                    if (!this.test(value, depth)) {
                        // console.log(`ControllerImpl[${this.constructor.name}].test(${item.id}, ${depth}):${propertyName} failed`);
                        return false;
                    } else {
                        // console.log(`ControllerImpl[${this.constructor.name}].test(${item.id}, ${depth}):${propertyName} success: [${childId}]`);
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
                for (const propertyName of Object.keys(responseItem.properties)) {
                    const value = responseItem[propertyName];
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
                    } else if (typeof value == 'object' && value instanceof SetupBase) {
                        // console.log(`ControllerImpl[${this.constructor.name}].getTree(${id}, ${depth}): process ${propertyName} as ObservableSetupBaseMap`);
                        await this.getTree(value.id, depth);
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

    private connectToParentMap(item: SetupBase): void {
        const parentProspect = item.parent;

        if (parentProspect) {
            const parentProperty = parentProspect[item.parentProperty];

            if (parentProperty instanceof ObservableSetupBaseMap) {
                console.log(`${callerAndfName()} connect ${item.id}/${item.className} in ${parentProspect.id}/${parentProspect.className}.${item.parentProperty}`);
                const existing = (parentProperty as ObservableSetupBaseMap<SetupBase>).get(item.id);
                
                switch (existing) {
                    case null:
                        console.debug(
                            `${callerAndfName()} connect null/unloaded ${item.id}/${item.className} in ${parentProspect.id}/${parentProspect.className}.${item.parentProperty}`);
                        parentProperty.set(item.id, item);
                        break;
                    case undefined:
                        console.warn(`${callerAndfName()} connect new ${item.id}/${item.className} in ${parentProspect.id}/${parentProspect.className}.${item.parentProperty}`);
                        parentProperty.set(item.id, item);
                        break;
                    default:
                        if (existing.id === item.id) {
                            // console.debug(`${callerAndfName()} connect skip existing ${item.id}/${item.className} ` +
                            //     `in ${parentProspect.id}/${parentProspect.className}.${item.parentProperty}`);
                        } else {
                            console.error(`${callerAndfName()} connect replace ${existing?.id}/${existing?.className} with ${item.id}/${item.className} ` +
                                `in ${parentProspect.id}/${parentProspect.className}.${item.parentProperty}`);
                            parentProperty.set(item.id, item);
                        }
                        break;
                }
            }
        }
    }

    protected connectPersistPropagate(args: ConnectItemArgs): void {
        const { item } = args;


        if (!this.configs.has(item.id)) {
            // const onObjectChange = (change: IObjectWillChange): IObjectWillChange => {
            //     const { name } = change;

            //     if (typeof name !== 'string') throw new Error(`${callerAndfName()} typeof name == ${typeof name} is not supported, must be string`);

            //     // console.debug(`${callerAndfName()} change(${item.id}, ${name}, ${change.type}): ${change['newValue']}`);

            //     switch (change.type) {
            //         case 'add':
            //             this.onItemChanged({ item, name, type: change.type, newValue: change.newValue });
            //             break;
            //         case 'update':
            //             this.onItemChanged({ item, name, type: change.type, newValue: change.newValue, oldValue: item[name] });
            //             break;
            //         case 'remove':
            //             this.onItemChanged({ item, name, type: change.type });
            //             break;
            //     }
            //     return change;
            // };
            // console.log( `${callerAndfName()}( ${item.className}[${item.id}]` );

            this.configs.set(item.id, item);
            this.connectToParentMap(item);
            // intercept(
            //     item,
            //     onObjectChange
            // );

            for (const propertyName of Object.keys(item.properties)) {
                const value = item[propertyName];

                if (value instanceof ObservableSetupBaseMap) {
                    // console.log(`ControllerImpl[${this.constructor.name}].connectPersistPropagate(${item.id}): observe ${propertyName} as ObservableSetupBaseMap`);
                    observe(
                        value as ObservableMap,
                        (changes: IMapDidChange<string, SetupBase | null>) => {
                            this.onMapChange({ ...changes, item, map: propertyName } as LocalMapChangeArgsType);
                        }
                    );
                } else if (isObservableArray(value)) {
                    // console.log(`ControllerImpl[${this.constructor.name}].connectPersistPropagate(${item.id}): observe ${propertyName} as ObservableSetupBaseMap`);
                    value.observe(
                        (changes: IArrayChange | IArraySplice) => {
                            this.onArrayChange({ ...changes, item, array: propertyName } as LocalArrayChangeArgsType);
                        }
                    );
                } else if (isObservableProp(item, propertyName)) {
                    const onPropertyChange = (change: IValueDidChange<any>): void => {
                        // console.debug(`${callerAndfName()} change(${item.id}, ${propertyName}, ${change.type}): ${change['newValue']}`);

                        switch (change.type) {
                            case 'update':
                                this.onItemChanged({ item, name: propertyName, type: change.type, newValue: change.newValue, oldValue: change.oldValue });
                                break;
                        }
                    };

                    // console.log(`ControllerImpl[${this.constructor.name}].connectPersistPropagate(${item.id}): observe ${propertyName} as ObservableProp`);
                    observe(
                        item,
                        propertyName as any,
                        onPropertyChange
                    );
                }
            }

            if (this.onItemConnected) {
                this.onItemConnected(item);
            }
        } else {
            // console.log(`ControllerImpl[${this.constructor.name}].connectPersistPropagate(${item.id}) skip already connected`);
        }

        // Connect child objects (SetupBase) in maps and properties
        for (const propertyName of Object.keys(item.properties)) {
            const value = item[propertyName];
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
            // console.log(`${callerAndfName()}${getLocalChangeArgsLog(change)} skip remoteUpdate=` +
            //     `${remotePlainValue && remotePlainValue['id'] ? remotePlainValue['id'] : remotePlainValue}`);
        } else {
            // console.debug(`${callerAndfName()}${getLocalChangeArgsLog(change)} != ` +
            //     `${remotePlainValue && remotePlainValue['id'] ? remotePlainValue['id'] : remotePlainValue}`);

            const ipcChange = {
                item: item.id,
                name: change.name,
                type: change.type,
                ...(itemPlainValue != undefined ? { newValue: itemPlainValue } : undefined)
            } as IpcChangeArgsType;

            if (newSetup) {
                this.connectPersistPropagate({ item: newSetup });
            }
            // if (this.remoteUpdates.has(change.item.id)) {
            this.addRemoteUpdate(ipcChange);
            // }
            this.propagate && this.propagate(ipcChange);
            this.tryPersist(change);
        }
    }

    private oncePersisted = new Map<string, null>();

    private shouldPersist = (change: LocalChangeArgsType): boolean => {
        const { item } = change;
        let key = item.id;
        let shouldPersist = (change.item.parent == undefined) || (change.item.id == Root.name) || (!change.item.parent.volatile(change.item.parentProperty));

        if (shouldPersist) {
            switch (change.type) {
                case 'add':
                case 'remove':
                case 'update':
                    if ('array' in change) {
                        shouldPersist = !item.volatile(change.array);
                    } else if ('map' in change) {
                        shouldPersist = !item.volatile(change.map);
                    } else {
                        shouldPersist = !item.volatile(change.name);
                    }
                    break;
                case 'delete':
                    shouldPersist = !item.volatile(change.map);
                    break;
                case 'splice':
                    shouldPersist = !item.volatile(change.array);
                    break;
                default:
                    throw new Error(`${callerAndfName()} change.type==${change['type']} not supported`);
            }
            key += '.' + (change['array'] ?? change['map'] ?? change['name']);
        }
        if ((shouldPersist == false) && (this.oncePersisted.has(key) == false )) {
            this.oncePersisted.set(key, null );
            shouldPersist = true;            
        }
        shouldPersist && console.debug(`${callerAndfName()}(${getLocalChangeArgsLog(change)}) shouldPersist[${key}]=${shouldPersist}`, this.oncePersisted);
        return shouldPersist;
    };

    private tryPersist = (change: LocalChangeArgsType): void => {
        this.persist != undefined
            && this.shouldPersist(change)
            && this.persist(change);
    };

    private onArrayChange = (changes: LocalArrayChangeArgsType): void => {
        const { item, array, index } = changes;

        // console.debug(`${callerAndfName()}${getLocalChangeArgsLog(changes)}`/*, changes*/);
        const newValue = changes['newValue'];
        const itemPlainValue = newValue != undefined ? SetupBase.getPlainValue(newValue) : undefined;
        const hasRemote = this.remoteUpdates.has(item.id) && this.remoteUpdates.get(item.id)?.[array]?.[index] !== undefined;
        const remotePlainValue = hasRemote ? this.remoteUpdates.get(item.id)?.[array][index] : undefined;

        if (changes.type == 'splice') {
            const { added, removedCount } = changes;
            const remoteArray: Array<PropertyType> | undefined = this.remoteUpdates.get(item.id)?.[array];
            const localArray: Array<ObjectPropertyType> = item[array];

            const hasUpdate = (remoteArray !== undefined) && (remoteArray.length == (localArray.length + added.length - removedCount));

            if (hasUpdate) {
                // console.log(`${callerAndfName()}${getLocalChangeArgsLog(changes)} skip remoteUpdate`);    
            } else {
                // console.log(`${callerAndfName()}${getLocalChangeArgsLog(changes)} propagate & persist`/*, changes*/);
                this.propagate && this.propagate(ControllerImpl.local2Ipc(changes));
                this.tryPersist(changes);
            }
        } else if (hasRemote && isEqual(itemPlainValue, remotePlainValue)) {
            // console.log(`${callerAndfName()}${getLocalChangeArgsLog(changes)} skip remoteUpdate ${remotePlainValue}`);
        } else {
            // console.log(`${callerAndfName()}${getLocalChangeArgsLog(changes)} propagate & persist`/*, changes*/);

            this.propagate && this.propagate(ControllerImpl.local2Ipc(changes));
            this.tryPersist(changes);
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
            // console.log(`${callerAndfName()}${getLocalChangeArgsLog(changes)} skip remoteUpdate ${remotePlainValue}`);
        } else {
            switch (type) {
                case 'add':
                    if (newSetup != undefined) {
                        // console.log( `${callerAndfName()}${getLocalChangeArgsLog(changes)} connect, propagate and persist ${newSetup.id}`);
                        this.connectPersistPropagate({ item: newSetup });
                        this.propagate && this.propagate({
                            item: item.id,
                            map,
                            name,
                            type,
                            newValue: newSetup.getShallow()
                        });
                        this.tryPersist(changes);
                    } else if (newValue) {
                        console.error(
                            `${callerAndfName()}${getLocalChangeArgsLog(changes)} skip undefined newSetup but newValue is defined`,
                            changes,
                            itemPlainValue,
                            remotePlainValue
                        );
                    } else {
                        console.log(`${callerAndfName()}${getLocalChangeArgsLog(changes)} skip null`);
                    }
                    break;
                case 'update':
                    console.warn(`${callerAndfName()}${getLocalChangeArgsLog(changes)} ignore`);
                    break;
                case 'delete':
                    // console.log(`${callerAndfName()}${getLocalChangeArgsLog(changes)} propagate and persist`);
                    this.propagate && this.propagate({
                        item: item.id,
                        map,
                        name,
                        type
                    });
                    this.tryPersist(changes);
                    break;
            }
        }
    }

    protected abstract getSetupImpl(id: string, depth: number): Promise<SetupBase>;

    protected readonly propagate: ((update: IpcChangeArgsType) => void) | undefined;

    protected persist: ((data: LocalChangeArgsType) => void) | undefined;

    protected remoteUpdates: Map<string, SetupBaseInterface> = new Map<string, SetupBaseInterface>();




    protected static local2Ipc = (local: LocalChangeArgsType): IpcChangeArgsType => {
        let result: IpcChangeArgsType;
        // {
        //     item: local.item.id,
        //     type: local.type
        // };
        switch (local.type) {
            case 'add':
                if ('map' in local) {
                    result = {
                        type: local.type,
                        item: local.item.id,
                        name: local.name,
                        map: local.map,
                        newValue: local.newValue == null ? null : local.newValue.getShallow()
                    };
                } else {
                    result = {
                        type: local.type,
                        item: local.item.id,
                        name: local.name,
                        newValue: SetupBase.getPlainValue(local.newValue)
                    };
                }
                break;
            case 'delete':
                result = {
                    type: local.type,
                    item: local.item.id,
                    name: local.name,
                    map: local.map
                };
                break;
            case 'remove':
                result = {
                    type: local.type,
                    item: local.item.id,
                    name: local.name
                };
                break;
            case 'splice':
                result = {
                    type: local.type,
                    item: local.item.id,
                    index: local.index,
                    array: local.array,
                    added: local.added.map(item => SetupBase.getPlainValue(item)),
                    removedCount: local.removedCount
                };
                break;
            case 'update':
                if ('array' in local) {
                    result = {
                        type: local.type,
                        item: local.item.id,
                        index: local.index,
                        array: local.array,
                        newValue: SetupBase.getPlainValue(local.newValue)
                    };
                } else if ('map' in local) {
                    result = {
                        type: local.type,
                        item: local.item.id,
                        name: local.name,
                        map: local.map,
                        newValue: local.newValue == null ? null : local.newValue.getShallow()
                    };
                } else {
                    result = {
                        type: local.type,
                        item: local.item.id,
                        name: local.name,
                        newValue: SetupBase.getPlainValue(local.newValue),
                        oldValue: local.oldValue == undefined ? local.oldValue : SetupBase.getPlainValue(local.oldValue)
                    };
                }
                break;
        }

        // this.updateChannels[listener.senderId].send(
        //     'change',
        //     {
        //         item: item.id,
        //         type: change.type,
        //         name: change.name,
        //         ...(map ? { map } : undefined),
        //         ...((change.type == 'add' || change.type == 'update') ? { newValue: (change.newValue == null ? null : SetupBase.getPlainValue(change.newValue)) } : undefined)
        //     } as IpcChangeArgsType,
        //     persist
        // );

        return result;
    }

    private addRemoteUpdate(update: IpcChangeArgsType): boolean {

        const itemUpdate = (update as IpcItemChangeArgsType).name ? (update as IpcItemChangeArgsType) : undefined;
        const mapUpdate = (update as IpcMapChangeArgsType).map ? (update as IpcMapChangeArgsType) : undefined;
        const arrayUpdate = (update as IpcArrayChangeArgsType).array ? (update as IpcArrayChangeArgsType) : undefined;
        const newItem = !this.remoteUpdates.has(update.item);

        if (newItem) {
            const item = this.configs.get(update.item);

            if (!item) {
                console.error(`${callerAndfName()}${getIpcArgsLog(update)}: not found in this.configs`);
                throw new Error(`${callerAndfName()}${getIpcArgsLog(update)}: not found in this.configs`);
            }

            this.remoteUpdates.set(
                update.item,
                item.getShallow()
            );
        }

        const remoteItem = this.remoteUpdates.get(update.item);

        if (remoteItem) {
            if (arrayUpdate === undefined && itemUpdate === undefined)
                throw new Error(`${callerAndfName()}${getIpcArgsLog(update)} arrayUpdate and itemUpdate are null update=${JSON.stringify(update)}`);

            const key = arrayUpdate ? arrayUpdate.index : itemUpdate ? itemUpdate.name : '';

            const remoteTarget: SetupBaseInterface | SetupBaseInterfaceDictionary<SetupBaseInterface> | Array<InterfacePropertyType> = mapUpdate ? remoteItem[mapUpdate.map] :
                arrayUpdate ? remoteItem[arrayUpdate.array] : remoteItem;

            if (arrayUpdate?.type == 'splice') {
                //Todo: How to check splice update
            } else if ((!newItem) && isEqual(remoteTarget[key], update['newValue'])) {
                console.warn(`${callerAndfName()}${getIpcArgsLog(update)}: skip already equal (old,new):`/*,
                    cloneDeep(remoteTarget[key]),
                    cloneDeep(update['newValue'])*/);
                return false;
            }
            // console.log(`${callerAndfName()}${getIpcArgsLog(update)}: = ${update['newValue']} newItem=${newItem}`);

            switch (update.type) {
                case 'add':
                case 'update':
                    // console.debug(`${callerAndfName()}${getIpcArgsLog(update)} ==${remoteTarget[key]}`);
                    remoteTarget[key] = update.newValue;
                    break;
                case 'remove':
                    // console.log(`${callerAndfName()}${getIpcArgsLog(update)} = undefined`);
                    remoteTarget[key] = undefined;
                    break;
                case 'delete':
                    if (!mapUpdate)
                        throw new Error(`${callerAndfName()}${getIpcArgsLog(update)} = no map: ${JSON.stringify(update)}`);
                    // console.log(`${callerAndfName()}${getIpcArgsLog(update)} = undefined`);
                    remoteTarget[key] = undefined;
                    break;
                case 'splice':
                    // console.debug(`${callerAndfName()}${getIpcArgsLog(update)} ==${remoteTarget[key]}`);
                    (remoteTarget as Array<InterfacePropertyType>).splice(update.index, update.removedCount, ...update.added);
                    break;
            }
        } else {
            throw new Error(
                `${callerAndfName()}${getIpcArgsLog(update)}: = ${update['newValue']}: no remote item, isNew=${newItem}`
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

        const hasItem = this.configs.has(update.item);
        // console.log( `[${sender}]${callerAndfName()}(${getIpcArgsLog(update)}, persist=${persist}) hasItem=${this.configs.has(update.item)}` );


        const localItem =
            this.configs.get(update.item) ??
            await this.getSetup(update.item, 0);
        const map = (update as IpcMapChangeArgsType).map;
        const name = (update as IpcItemChangeArgsType).name;
        const array = (update as IpcArrayChangeArgsType).array;

        if ( /* (process.type != 'browser') && */ (!hasItem)) {
            const parent = this.configs.get(localItem.parentId) ??
                await this.getSetup(localItem.parentId, 0);
            console.warn(
                `[${sender}]${callerAndfName()}${getIpcArgsLog(update)}, persist=${persist}) ` +
                `hasItem=${hasItem} localItem=${localItem.parentId}.${localItem.parentProperty}.${localItem.id}` +
                ` .parent=${localItem.parent?.id} parent=${parent?.id} .${localItem.parentProperty}=${parent?.[localItem.parentProperty]}`
            );
            if (parent[localItem.parentProperty] === undefined) {
                parent[localItem.parentProperty] = localItem;
            }
        }

        if (this.addRemoteUpdate(update)) {
            if (map) {
                const localMap = localItem[map] as ObservableSetupBaseMap<SetupBase>;

                switch (update.type) {
                    case 'add':
                    case 'update':
                        if (update.newValue == null) {
                            // console.debug(`[${sender}]${callerAndfName()}${getIpcArgsLog(update)}, persist=${persist})`);
                            localMap.set(
                                name,
                                null
                            );
                        } else if (typeof update.newValue == 'object') {
                            // console.debug(`[${sender}]${callerAndfName()}${getIpcArgsLog(update)}, persist=${persist})`);
                            localMap.set(
                                name,
                                update.newValue == null ? null :
                                    this.createNewSetup(update.newValue as SetupBaseInterface)
                            );
                        } else
                            throw new Error(
                                `${callerAndfName()}${getIpcArgsLog(update)}, persist=${persist}) only SetupItem supported ${JSON.stringify(update.newValue)}`);

                        break;
                    case 'delete':
                        // console.debug(`[${sender}]${callerAndfName()}${getIpcArgsLog(update)}`);
                        localMap.delete(update.name);
                        break;
                }
            } else if (array) {
                const { index, type } = update as IpcArrayChangeArgsType;

                switch (type) {
                    case 'update':
                        {
                            const { newValue } = update as IpcArrayUpdateArgs;
                            // console.debug(`[${sender}]${callerAndfName()}${getIpcArgsLog(update)}, persist=${persist}) ==${localItem[array][index]}`);

                            localItem[array][index] = this.getValue(newValue);
                        }
                        break;
                    case 'splice':
                        {
                            // console.debug(`${callerAndfName()}${getIpcArgsLog(update)}, persist = ${persist})`);
                            const { added, index, removedCount } = update as IpcArraySpliceArgs;
                            const target = localItem[array] as IObservableArray;

                            target.spliceWithArray(index, removedCount, added);
                        }
                        break;
                }
            } else {
                switch (update.type) {
                    case 'add':
                    case 'update':
                        // console.debug(`[${sender}]${callerAndfName()}${getIpcArgsLog(update)}, persist=${persist})`);
                        if (update.newValue == null)
                            throw new Error(
                                `${callerAndfName()}${getIpcArgsLog(update)}, persist=${persist}) newValue == null`);
                        localItem[name] = this.getValue(update.newValue);
                        break;
                    case 'remove':
                        console.debug(`[${sender}]${callerAndfName()}${getIpcArgsLog(update)}, persist=${persist}) = delete`);
                        // remoteItem[update.name] = undefined;
                        delete localItem[update.name];
                        break;
                }
            }
        } else {
            // console.warn(
            //     `[${sender}]${callerAndfName()}${getIpcArgsLog(update)}, persist=${persist}) ==? ${update['newValue']} skip remote update`/*, cloneDeep(update)*/);
        }

        (persist == true) && this.tryPersist({
            ...update,
            item: localItem,
            // ...(name ? { name } : undefined),
            // ...(index !== undefined ? { index } : undefined),
            // type: update.type,
            // ...(map ? { map } : undefined),
            // ...(array ? { array } : undefined),
            ...(('newValue' in update) ?
                { newValue: (update.newValue == null ? null : (update.newValue['id'] ? this.configs.get(update.newValue['id']) : update.newValue)) } :
                undefined),
            ...(('oldValue' in update) ?
                { oldValue: (update.oldValue == null ? null : (update.oldValue['id'] ? this.configs.get(update.oldValue['id']) : update.oldValue)) } :
                undefined)
        } as LocalChangeArgsType);
    }
}

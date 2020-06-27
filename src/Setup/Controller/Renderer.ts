import { toJS, observe, IObjectDidChange, isObservableArray, IObservableArray } from 'mobx';
import { IpcRendererEvent, ipcRenderer as electronIpcRenderer, remote } from 'electron';
import { SetupBase, PropertyType as SetupPropertyType } from '../SetupBase';
import { SetupItemId, SetupBaseInterface, SetupLinkInterface, PropertyType } from '../SetupInterface';
import { ControllerImpl, LocalChangeArgsType, LocalMapChangeArgsType, LocalItemChangeArgsType, LocalArrayChangeArgsType } from './Controller';
import { create } from '../SetupFactory';
import { ObservableSetupBaseMap } from '../Container';
import { IpcChangeArgsType, IpcRenderer, IpcAddSchemaArgs } from './IpcInterface';

import { Root } from '../Application/Root';
import { Screen } from '../Application/Screen';
import { Plugin } from '../Application/Plugin';
import { cloneDeep } from 'lodash';
import { caller, fName, callerAndfName } from '../../utils/debugging';

export class Renderer extends ControllerImpl {
    protected ipc: IpcRenderer = electronIpcRenderer;

    private windowId: number;

    constructor() {
        super();

        this.windowId = remote.getCurrentWindow().id;

        // console.log(`${this.constructor.name}() ${this.windowId}`);

        this.ipc.on('change', (...args) => this.onSetupChanged(...args));

        if (!SetupBase.activeSchema.definitions)
            throw new Error(`${this.constructor.name} no schema definitions`);

        observe(
            SetupBase.activeSchema.definitions,
            this.onSchemaDefinitionChanged
        );

        this.ipc.on('addSchema', this.onAddSchema);
    }

    private onAddSchema = (e: IpcRendererEvent, args: IpcAddSchemaArgs): void => {
        Plugin.add(args.schema);
    }

    protected onSchemaDefinitionChanged = (change: IObjectDidChange): void => {


        switch (change.type) {
            case 'add':
                // console.log(`${callerAndfName()}(${change.type} ${String(change.name)})`);
                this.ipc.send('addSchema', { schema: toJS(change.newValue) });
                break;
            case 'update':
            case 'remove':
                console.error(`${callerAndfName()}(${change.type} ${String(change.name)}) only add is supported`);
                break;

        }
    }

    protected loadChildren(item: SetupBase, depth: number): void {
        if (depth != 0) {
            for (const value of Object.values(item)) {
                if (value instanceof ObservableSetupBaseMap) {
                    // console.log(`${callerAndfName()}(${item.id}, ${depth}): get children in ${propertyName}`);
                    const container = value as ObservableSetupBaseMap<SetupBase>;
                    for (const itemId of container.keys()) {
                        container.set(
                            itemId,
                            this.getSetupSync(itemId, depth - 1)
                        );
                    }
                } else if (value instanceof SetupBase) {
                    // console.log(`${callerAndfName()}(${item.id}, ${depth}): load children in ${propertyName}`);
                    this.loadChildren(value as SetupBase, depth);
                } else {
                    // console.log(`${callerAndfName()}(${id}): don't add children in ${propertyName} as not ObservableSetupBaseMap`);
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

    // protected onCached = (item: SetupBase, depth: number): void => {

    //     // this.registerWithMain(item, depth);
    // }

    protected registerWithMain(item: SetupBase, depth: number): void {

        this.registrations.push({ itemId: item.id, depth: depth });

        this.ipc.send('register', { itemId: item.id, depth: depth });
    }

    protected async getSetupImpl(id: string, depth: number): Promise<SetupBase> {
        const item = this.getSetupSync(id, depth);

        this.registerWithMain(item, depth);

        return item;
    }

    private resolveLinks = (item: SetupBaseInterface): void => {
        // console.log(`${callerAndfName()}(${item.id})`);

        for (const [propertyName, value] of Object.entries(item)) {
            if (typeof value == 'object' && ((value as SetupLinkInterface).id)) {
                // console.log(`${callerAndfName()}(${item.id}): resolve ${propertyName} - ${(value as SetupLinkInterface).id}`);
                item[propertyName] = this.loadPlain((value as SetupLinkInterface).id);
                this.resolveLinks(item[propertyName]);
            }
        }
    }

    private loadPlain = (id: SetupItemId): SetupBaseInterface => {
        const itemString = localStorage.getItem(id);

        if (!itemString)
            throw new Error(`${callerAndfName()}(-> ${id} <-): can't load/find`);

        try {
            return JSON.parse(itemString);
        } catch (error) {
            console.error(`${this.constructor.name}: loadPlain(${id}): caught ${error} parsing ${itemString}`, error);
            throw error;
        }

    }

    private load(id: string): SetupBase {
        // console.log(`${this.constructor.name}: load(${id})`);
        let item: SetupBase;

        try {
            const itemPlain = this.loadPlain(id);

            this.resolveLinks(itemPlain);

            item = create(itemPlain);
        } catch (error) {

            if (id == Root.name) {
                item = Root.createNewBlank();
                console.warn(`${this.constructor.name}: load(${id}): new Blank`, cloneDeep(item));
                this.persist({ item: item, type: 'add', name: '', newValue: '' });
            } else if (id == Screen.name) {
                item = Screen.createNewBlank(Root.name, 'screen');
                console.warn(`${this.constructor.name}: load(${id}): new Blank`, cloneDeep(item));
                this.persist({ item: item, type: 'add', name: '', newValue: '' });
            } else
                throw error;
        }
        return item;
    }

    protected readonly propagate = (update: IpcChangeArgsType): void => {
        // console.log(`${callerAndfName()}(${update.item}, ${update.name}, ${update.type}) send to main`/*, item*/);
        this.ipc.send('change', update);
    }

    static createLinks(item: SetupBaseInterface): void {
        for (const [propertyName, value] of Object.entries(item)) {
            const setup = (value as SetupBaseInterface);

            if (value === undefined) {
                // skip optional
            } else  if (setup.id) {
                item[propertyName] = { id: setup.id };
            } else if (Array.isArray(value)) {
                // Keep elements as they are
                if ((value.length > 0) && ['object', 'symbol', 'function', 'bigint'].includes(typeof value[0])) {
                    throw new Error(
                        `${caller()}->SetupBase.${fName()}(${item.id}/${item.className}).${propertyName}: Array content type ${typeof value[0]} is not supported: ` +
                        `${JSON.stringify(value)}`);
                }
            } else if (typeof value == 'object') {
                for (const id of Object.keys(value)) {
                    value[id] = null;
                }
            }
        }
    }

    private delete = (item: SetupBase): void => {
        console.debug(`${callerAndfName()}(${item.id})`);
        localStorage.removeItem(item.id);
        for (const [propertyName, propertyChild] of Object.entries(item)) {
            if (propertyChild instanceof SetupBase) {
                console.debug(`${callerAndfName()}(${item.id}) delete child ${propertyName}==${propertyChild.id}`);
                this.delete(propertyChild);
            } else if (propertyChild instanceof ObservableSetupBaseMap) {
                this.deleteMap( propertyChild as ObservableSetupBaseMap<SetupBase>);
            } else if (isObservableArray(propertyChild)) {
                this.deleteArray( propertyChild as IObservableArray<SetupPropertyType>);
            }
        }
    };

    private deleteMap = (map: ObservableSetupBaseMap<SetupBase>): void => {
        for (const [childId, prospect] of map.entries()) {
            const child = prospect ?? this.tryGetSetupSync(childId, 0);
            if (!child) throw new Error(`${callerAndfName()} can't get map child [${childId}]`);

            this.delete(child);
        }
    };

    private deleteArray = (array: IObservableArray<SetupPropertyType>): void => {
        for (const prospect of array) {
            if (prospect instanceof SetupBase) {
                console.debug(`${callerAndfName()} delete array child ${prospect.id}`);
                this.delete(prospect);
            } else if (prospect instanceof ObservableSetupBaseMap) {
                this.deleteMap(prospect as ObservableSetupBaseMap<SetupBase>);
            } else if (isObservableArray(prospect)) {
                this.deleteArray(prospect as IObservableArray<SetupPropertyType>);
            }
        }
    }

    protected persist = (change: LocalChangeArgsType): void => {
        const { item } = change;

        if (!(item.id != undefined && item.className != undefined && item.parentId != undefined))
            throw new Error(`${callerAndfName()}${ControllerImpl.getLocalArgsLog(change)}: Invalid object: ${JSON.stringify(item)}`);

        const array = (change as LocalArrayChangeArgsType).array;
        const index = (change as LocalArrayChangeArgsType).index;
        const map = (change as LocalMapChangeArgsType).map;
        const name = (change as LocalItemChangeArgsType).name;


        // console.log( `${callerAndfName()}${ControllerImpl.getLocalArgsLog(change)}`/*, cloneDeep(change), cloneDeep(item) */);

        const shallow = item.getShallow();

        // Update shallow as newValue not applied yet (called by intercept)
        const newValue = 'newValue' in change ? change.newValue : undefined;

        if (name !== '') {
            if (change.type == 'splice') {
                (shallow[array] as Array<PropertyType>).splice(
                    index,
                    change.removedCount,
                    ...change.added.map( item => SetupBase.getPlainValue(item))
                );
            } else if (change.type == 'delete') {
                delete shallow[change.map][change.name];
                localStorage.removeItem(change.name);
            } else if (newValue != undefined) {
                if (array) {
                    shallow[array][index] = SetupBase.getPlainValue(newValue);
                } else if (map) {
                    shallow[map][name] = newValue == null ? newValue : SetupBase.getPlainValue(newValue);
                } else {
                    shallow[name] = SetupBase.getPlainValue(newValue);
                }
            }
        }

        Renderer.createLinks(shallow);
        localStorage.setItem(item.id, JSON.stringify(shallow));

        const newSetup = newValue instanceof SetupBase ? newValue as SetupBase : undefined;
        const oldValue = 'oldValue' in change ? change.oldValue : undefined;
        const oldSetup = oldValue instanceof SetupBase ? oldValue as SetupBase : undefined;

        if (newSetup) {
            if (oldSetup && (oldSetup.id != newSetup.id)) {
                console.debug(`${callerAndfName()}${ControllerImpl.getLocalArgsLog(change)}=${newSetup.id}, remove from storage ${oldSetup.id}`);
                localStorage.removeItem(oldSetup.id);
            }

            let persistedChild = false;

            /// Persists properties children
            for (const [propertyName, child] of Object.entries(newSetup)) {
                if (child instanceof SetupBase) {
                    this.persist({ item: newSetup, type: 'add', name: propertyName, newValue: child });
                    persistedChild = true;
                }
            }
            if (!persistedChild) {
                this.persist({ item: newSetup, name: 'id', type: 'add', newValue: newSetup.id });
            }
        } else if (change.type == 'delete') {
            console.debug(`${callerAndfName()}${ControllerImpl.getLocalArgsLog(change)} delete ${change.name}`);
            const toBeDeleted: SetupBase | undefined = item[change.map].get(change.name) ?? this.tryGetSetupSync(change.map, 0);
            if (!toBeDeleted) throw new Error(`${callerAndfName()}${ControllerImpl.getLocalArgsLog(change)}can't get ${change.name}`);

            this.delete(toBeDeleted);
        } else if (name === '') {
            /// Persists properties children
            for (const child of Object.values(item)) {
                if (child instanceof SetupBase) {
                    this.persist({ item: child, type: 'add', name: '', newValue: '' });
                }
            }
        }
    }
}

import { toJS, observe, IObjectDidChange } from 'mobx';
import { IpcRendererEvent, ipcRenderer as electronIpcRenderer, remote } from 'electron';
import { SetupBase } from '../SetupBase';
import { SetupItemId, SetupBaseInterface, SetupLinkInterface } from '../SetupInterface';
import { ControllerImpl, LocalChangeArgsType } from './Controller';
import { create } from '../SetupFactory';
import { ObservableSetupBaseMap } from '../Container';
import { IpcChangeArgsType, IpcRenderer, IpcAddSchemaArgs } from '../IpcInterface';

import { Root } from '../Application/Root';
import { Screen } from '../Application/Screen';
import { Plugin } from '../Application/Plugin';

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
                // console.log(`${this.constructor.name}.onSchemaDefinitionChanged(${change.type} ${String(change.name)})`);
                this.ipc.send('addSchema', { schema: toJS(change.newValue) });
                break;
            case 'update':
            case 'remove':
                console.error(`${this.constructor.name}.onSchemaDefinitionChanged(${change.type} ${String(change.name)}) only add is supported`);
                break;

        }
    }

    protected loadChildren(item: SetupBase, depth: number): void {
        if (depth != 0) {
            for (const value of Object.values(item)) {
                if (value instanceof ObservableSetupBaseMap) {
                    // console.log(`${this.constructor.name}.loadChildren(${item.id}, ${depth}): get children in ${propertyName}`);
                    const container = value as ObservableSetupBaseMap<SetupBase>;
                    for (const itemId of container.keys()) {
                        container.set(
                            itemId,
                            this.getSetupSync(itemId, depth - 1)
                        );
                    }
                } else if (value instanceof SetupBase) {
                    // console.log(`${this.constructor.name}.loadChildren(${item.id}, ${depth}): load children in ${propertyName}`);
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

        this.registrations.push({ itemId: item.id, depth: depth });

        this.ipc.send('register', { itemId: item.id, depth: depth });
    }

    protected async getSetupImpl(id: string, depth: number): Promise<SetupBase> {
        const item = this.getSetupSync(id, depth);

        this.registerWithMain(item, depth);

        return item;
    }

    private resolveLinks = (item: SetupBaseInterface): void => {
        // console.log(`${this.constructor.name}.resolveLinks(${item.id})`);

        for (const [propertyName, value] of Object.entries(item)) {
            if (typeof value == 'object' && ((value as SetupLinkInterface).id)) {
                // console.log(`${this.constructor.name}.resolveLinks(${item.id}): resolve ${propertyName} - ${(value as SetupLinkInterface).id}`);
                item[propertyName] = this.loadPlain((value as SetupLinkInterface).id);
                this.resolveLinks(item[propertyName]);
            }
        }
    }

    private loadPlain = (id: SetupItemId): SetupBaseInterface => {
        const itemString = localStorage.getItem(id);

        if (!itemString)
            throw new Error(`${this.constructor.name}.loadPlain(-> ${id} <-): can't load/find`);

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
                console.warn(`${this.constructor.name}: load(${id}): new Blank`, item);
                this.persist({ item: item, type: 'add', name: 'id', newValue: item.id });
            } else if (id == Screen.name) {
                item = Screen.createNewBlank(Root.name);
                console.warn(`${this.constructor.name}: load(${id}): new Blank`, item);
                this.persist({ item: item, type: 'add', name: 'id', newValue: item.id });
            } else
                throw error;
        }
        return item;
    }

    protected readonly propagate = (update: IpcChangeArgsType): void => {
        // console.log(`${this.constructor.name}.propapgate(${update.item}, ${update.name}, ${update.type}) send to main`/*, item*/);
        this.ipc.send('change', update);
    }


    protected persist = (change: LocalChangeArgsType): void => {
        const { item, name, type } = change;

        if (!(item.id != undefined && item.className != undefined && item.parentId != undefined))
            throw new Error(`${this.constructor.name}.persist(${name}, ${type} ): Invalid object: ${JSON.stringify(item)}`);

        // console.log(`${this.constructor.name}.persist(${item.id}, ${name}, ${type}, ${change['newValue']})`/*, item*/);
        const shallow = item.getShallow();

        ControllerImpl.createLinks(shallow);

        localStorage.setItem(item.id, JSON.stringify(shallow));

        const newValue = 'newValue' in change ? change.newValue : undefined;
        const newSetup = newValue instanceof SetupBase ? newValue as SetupBase : undefined;
        const oldValue = 'oldValue' in change ? change.oldValue : undefined;
        const oldSetup = oldValue instanceof SetupBase ? oldValue as SetupBase : undefined;

        if (newSetup) {
            if (oldSetup && (oldSetup.id != newSetup.id)) {
                console.log(`${this.constructor.name}.persist(${item.id}, ${name}, ${type})=${newSetup.id}, remove from storage ${oldSetup.id}`);
                localStorage.removeItem(oldSetup.id);
            }

            let persistedChild = false;

            for (const [propertyName, child] of Object.entries(newSetup)) {
                if (child instanceof SetupBase) {
                    this.persist({ item: newSetup, type: 'add', name: propertyName, newValue: child });
                    persistedChild = true;
                }
            }
            if (!persistedChild) {
                this.persist({ item: newSetup, name: 'id', type: 'add', newValue: item.id });
            }
        } else if (type == 'delete') {
            console.log(`${this.constructor.name}.persist(${item.id}, ${name}, ${type}) delete ${name}`);
            localStorage.removeItem(change.name);
        }
    }
}


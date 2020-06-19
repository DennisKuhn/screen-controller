import { BrowserWindow, ipcMain as electronIpcMain, IpcMainEvent, WebContents } from 'electron';
import { JSONSchema7 } from 'json-schema';
import { IMapDidChange, isObservableProp, reaction, toJS, isObservableArray, IArrayChange, IArraySplice } from 'mobx';
import { callerAndfName } from '../../utils/debugging';
import { Plugin } from '../Application/Plugin';
import { ObservableSetupBaseMap } from '../Container';
import { IpcAddSchemaArgs, IpcChangeArgsType, IpcInitArgs, IpcMain, IpcRegisterArgs, IpcWindow, getIpcArgsLog } from '../IpcInterface';
import { resolve } from '../JsonSchemaTools';
import { SetupBase } from '../SetupBase';
import { create } from '../SetupFactory';
import { SetupItemId } from '../SetupInterface';
import { UpdateChannel } from '../UpdateChannel';
import { ControllerImpl, LocalChangeArgsType, LocalItemChangeArgsType, LocalMapChangeArgsType, SetupPromise, LocalArrayChangeArgsType } from './Controller';

interface ChangeListener {
    senderId: number;
    itemId: SetupItemId;
    depth: number;
    disposers: (() => void)[];
}

export class Main extends ControllerImpl {
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

        this.ipc.on('addSchema', this.onAddSchema);
    }

    private senderUpdates = new Array<{}>();

    private updateChannels = new Array<UpdateChannel | undefined>();


    async onSetupChanged(e: Event, update: IpcChangeArgsType, persist?: boolean): Promise<void> {
        const mainEvent = e as IpcMainEvent;
        const updateChannel = this.updateChannels[mainEvent.sender.id];

        if (!updateChannel)
            throw new Error(`${callerAndfName()}(${mainEvent.sender.id} doesn't exist in updateChannels ${Array.from(this.updateChannels.keys())})`);

        console.log(`${callerAndfName()}[${mainEvent.sender.id}]${getIpcArgsLog(update)}`);

        updateChannel.addReceived(update);

        super.onSetupChanged(e, update, persist);
    }

    private onAddSchema = (e: IpcMainEvent, args: IpcAddSchemaArgs): void => {
        // console.log(`${callerAndfName()}(${e.sender.id}, ${args.schema.$id})`);

        Plugin.add(args.schema);

        for (const listener of this.updateChannels) {
            if ((listener != undefined) && (listener.ipc.id != e.sender.id)) {
                console.log(`${callerAndfName()}(${e.sender.id}, ${args.schema.$id}) send to ${listener.ipc.id}`);
                listener.ipc.send('addSchema', { schema: args.schema });
            }
        }
    }


    private onRegister = (e: IpcMainEvent, args: IpcRegisterArgs): void => {
        this.register(e.sender, args);
    }

    private unRegister = (channelId: number): void => {
        console.log(`${callerAndfName()}[${channelId}]`);

        this.changeListeners
            .filter(listener => listener.senderId == channelId)
            .forEach(listener => {
                console.log(`${callerAndfName()}[${channelId}]: ${listener.itemId},${listener.depth} disposer: ${listener.disposers.length}`);
                listener.disposers.forEach(disposer => disposer());
                this.changeListeners.splice(
                    this.changeListeners.indexOf(listener)
                );
            });


        this.updateChannels[channelId] = undefined;
    }

    private register = (target: WebContents, { itemId, depth }: IpcRegisterArgs): void => {
        const senderId = target.id;


        if (this.configs.size == 0) {
            // console.log(`${callerAndfName()}[${this.changeListeners.length}]` +
            //     `(senderId=${senderId}, ${itemId}, d=${depth}) ignore - Hopefully own init for full config`);
            return;
        }


        if (this.updateChannels[senderId] == undefined) {
            console.log(`${callerAndfName()}[${this.changeListeners.length}]` +
                `(senderId=${senderId}, ${itemId}, d=${depth}) create updateChannel`);

            this.updateChannels[senderId] = new UpdateChannel(target);
            target.once('destroyed', () => this.unRegister(senderId));

        } else {
            // console.log(`${callerAndfName()}[${this.changeListeners.length}]` +
            //     `(senderId=${senderId}, ${itemId}, d=${depth}) updateChannel exists`);
        }
        const listener: ChangeListener = {
            senderId,
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

        if (this.configs.size == 0) {
            console.log(`${callerAndfName()}[${listener.senderId},${listener.itemId},${listener.depth}]: no config yet`);
            return;
        }

        item = item ?? this.configs.get(listener.itemId);
        depth = depth ?? 0;

        if (!item)
            throw new Error(`${callerAndfName()}([${listener.senderId},${listener.itemId},${listener.depth}] @ ${depth}`);

        this.connectChangeListener(item, listener, depth);

        for (const value of Object.values(item)) {
            if (((listener.depth == -1) || (depth < listener.depth)) && (value instanceof ObservableSetupBaseMap)) {
                // console.log(
                //     `${callerAndfName()}[${listener.senderId},${listener.itemId},${listener.depth}]:` +
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
                //     `${callerAndfName()}[${listener.senderId},${listener.itemId},${listener.depth}]: ignore ${propertyName}.${item.id}`);
            }
        }
    }

    private connectChangeListener(item: SetupBase, listener: ChangeListener, offset = 0): void {
        // console.log(`${callerAndfName()}[${listener.senderId},${listener.itemId},${listener.depth}] ${item.id} @${listener.depth - offset}`);

        for (const [propertyName, value] of Object.entries(item)) {
            if (value instanceof ObservableSetupBaseMap) {
                // console.log(
                //     `${callerAndfName()}[${listener.senderId},${listener.itemId},${listener.depth}]:` +
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
                            // console.debug(
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
            } else if (isObservableArray(value)) {
                console.log(`[${this.constructor.name}].connectChangeListener[${listener.senderId},${listener.itemId},${listener.depth}]: observe ${item.id}.${propertyName}`);

                listener.disposers.push(
                    value.observe(
                        (change: IArrayChange | IArraySplice) => {
                            const { object, ...rest } = change;

                            this.onChangeItemChanged(
                                listener,
                                {
                                    ...rest,
                                    array: propertyName,
                                    item
                                }
                            );
                        },
                        false
                    )
                );
            } else if (isObservableProp(item, propertyName)) {
                // console.log(`[${this.constructor.name}].connectChangeListener[${listener.senderId},${listener.itemId},${listener.depth}]: observe ${item.id}.${propertyName}`);

                listener.disposers.push(
                    reaction(
                        () => item[propertyName],
                        newValue => this.onChangeItemChanged(listener, { item, name: propertyName, type: 'update', newValue, oldValue: item[propertyName] }),
                        {
                            name: `ChangeListener[${listener.senderId}, ${listener.itemId}, ${listener.depth}] @ ${item.id}.${propertyName} @${offset}`
                        }
                    )
                );
            } else {
                // console.log(`${callerAndfName()}[${listener.senderId},${listener.itemId},${listener.depth}]: ignore ${propertyName}.${item.id}`);
            }
        }
    }

    private onChangeItemChanged = (listener: ChangeListener, change: LocalChangeArgsType): void => {
        const { item, type } = change;

        if (!(item.id != undefined && item.className != undefined && item.parentId != undefined))
            throw new Error(
                `${callerAndfName()}(${name}, ${type} ): Invalid object: ${JSON.stringify(item)}`);

        const channel = this.updateChannels[listener.senderId];

        if (channel == undefined) {
            console.error(`${callerAndfName()}[${listener.senderId}](${ControllerImpl.getLocalArgsLog(change)} ): no channel`);
            return;
        }
        const map = (change as LocalMapChangeArgsType).map;
        const array = (change as LocalArrayChangeArgsType).array;

        if ((change as LocalMapChangeArgsType).map != undefined) {
            const mapChange = change as LocalMapChangeArgsType;
            switch (mapChange.type) {
                case 'add':
                    channel.send(
                        'change',
                        {
                            item: item.id,
                            type: mapChange.type,
                            name: mapChange.name,
                            map: map,
                            newValue: mapChange.newValue == null ? null : mapChange.newValue.getShallow()
                        },
                        false
                    );
                    break;
                case 'update':
                    channel.send(
                        'change',
                        {
                            item: item.id,
                            type: mapChange.type,
                            name: mapChange.name,
                            map: map,
                            newValue: mapChange.newValue == null ? null : mapChange.newValue.getShallow()
                        },
                        false
                    );
                    break;
                case 'delete':
                    channel.send(
                        'change',
                        {
                            item: item.id,
                            type: mapChange.type,
                            name: mapChange.name,
                            map: map
                        },
                        false
                    );
                    break;
            }
        } else if ((change as LocalArrayChangeArgsType).array != undefined) {
            const arrayChange = change as LocalArrayChangeArgsType;
            switch (arrayChange.type) {
                case 'update':
                    channel.send(
                        'change',
                        {
                            item: item.id,
                            type: arrayChange.type,
                            index: arrayChange.index,
                            array: map,
                            newValue: SetupBase.getPlainValue( arrayChange.newValue )
                        },
                        false
                    );
                    break;
                case 'splice':
                    channel.send(
                        'change',
                        {
                            item: item.id,
                            type: arrayChange.type,
                            index: arrayChange.index,
                            added: arrayChange.added,
                            removedCount: arrayChange.removedCount,
                            array: array
                        },
                        false
                    );
                    break;
            }
        } else {
            const itemChange = change as LocalItemChangeArgsType;
            switch (itemChange.type) {
                case 'add':
                    channel.send(
                        'change',
                        {
                            item: item.id,
                            type: itemChange.type,
                            name: itemChange.name,
                            newValue: SetupBase.getPlainValue(itemChange.newValue)
                        },
                        false
                    );
                    break;
                case 'update':
                    channel.send(
                        'change',
                        {
                            item: item.id,
                            type: itemChange.type,
                            name: itemChange.name,
                            newValue: SetupBase.getPlainValue(itemChange.newValue),
                            oldValue: SetupBase.getPlainValue(itemChange.oldValue)
                        },
                        false
                    );
                    break;
                case 'remove':
                    channel.send(
                        'change',
                        {
                            item: item.id,
                            type: itemChange.type,
                            name: itemChange.name
                        },
                        false
                    );
                    break;
            }
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
    }


    private connectChangeListeners(item: SetupBase): void {
        // console.log(`${callerAndfName()}[${this.changeListeners.length}](${item.id},${fireImmediately})`);
        for (const listener of this.changeListeners) {
            /// Check if ancestor in within depth is listening
            for (
                let offset = 0, ancestor: SetupBase | undefined = item;
                ((listener.depth == -1) || (offset <= listener.depth)) && (ancestor);
                offset += 1, ancestor = ancestor.parentId == ancestor.id ? undefined : this.configs.get(ancestor.parentId)
            ) {
                if (listener.itemId == ancestor.id) {
                    this.connectChangeListener(item, listener, offset);
                    break;
                }
            }
        }
    }

    protected onItemConnected = (item: SetupBase): void => {
        // console.log(`${callerAndfName()}(${item.id}) fireImmediately=${fireImmediately}`);
        this.connectChangeListeners(item);
    }

    static isPluginSchema = (schema: JSONSchema7, root: JSONSchema7): boolean =>
        schema.allOf != undefined
        && schema.allOf.some(pluginRefProspect =>
            (typeof pluginRefProspect == 'object')
            && ((pluginRefProspect.$ref == Plugin.name)
                || Main.isPluginSchema(resolve(pluginRefProspect, root), root))
        );


    private onInit = (e: IpcMainEvent, init: IpcInitArgs): void => {
        const { schema, root: rootPlain } = init;

        console.log(`${callerAndfName()}: sender=${e.sender}`/*, schema*/);


        if (!schema.definitions)
            throw new Error(`${callerAndfName()}: no schema.definitions sender=${e.sender}`);

        Object.values(schema.definitions)
            .filter(schemaDef =>
                Main.isPluginSchema(schemaDef as JSONSchema7, schema)
            )
            .forEach(definition =>
                Plugin.add(definition as JSONSchema7));

        const root = create(rootPlain);

        this.connectPersistPropagate({ item: root });

        this.ipcStorage = e.sender;

        this.resolvePromises();
    }

    private resolvePromises = (): void => {
        // console.log(`${callerAndfName()}[${this.promises.length}]`);

        for (const promise of this.promises) {
            const item = this.configs.get(promise.id);

            if (!item) {
                console.error(`${callerAndfName()}() can't resolve ${promise.id}`);
                promise.reject(`${callerAndfName()}() can't resolve ${promise.id}`);
            } else {
                if (!this.ipcStorage)
                    throw new Error(`${callerAndfName()}(${promise.id}, ${promise.depth}): no IPC storage to register`);

                // console.log(`${callerAndfName()}( ${promise.id}, ${promise.depth} )`);

                this.register(this.ipcStorage, { itemId: promise.id, depth: promise.depth });
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
                        console.error(`${callerAndfName()}(${id}, ${depth}): doesn't exist promises=${this.promises.length}`);
                    } else {
                        // console.log(`${callerAndfName()}(${id}, ${depth}): wait for init promises=${this.promises.length}`);
                    }
                } else {
                    if (!this.ipcStorage)
                        throw new Error(`${callerAndfName()}(${id}, ${depth}): no IPC storage to register`);

                    // console.log(`${callerAndfName()}(${id}, ${depth}): resolve ${responseItem.id}` /*, responseItem.getPlainDeep() */);                    

                    this.register(this.ipcStorage, { itemId: responseItem.id, depth });
                    resolve(responseItem);
                }
            });
    }


    protected persist = (change: LocalChangeArgsType): void => {
        const { item } = change;

        if (!(item.id != undefined && item.className != undefined && item.parentId != undefined))
            throw new Error(
                `${callerAndfName()}${ControllerImpl.getLocalArgsLog(change)}: Invalid object: ${JSON.stringify(item)}`);

        if (this.ipcStorage == undefined)
            throw new Error(`${callerAndfName()}${ControllerImpl.getLocalArgsLog(change)}: no ipcStorage`);

        if (this.ipcStorage.isDestroyed()) {
            console.warn(`${callerAndfName()}${ControllerImpl.getLocalArgsLog(change)}: ipcStorage is destroyed`);
            return;
        }
        
        const channel = this.updateChannels[this.ipcStorage.id];

        if (channel == undefined)
            throw new Error(`${callerAndfName()}${ControllerImpl.getLocalArgsLog(change)}: no channel for ${this.ipcStorage.id}`);
        
        // console.log(`${callerAndfName()}${ControllerImpl.getLocalArgsLog(change)} -> [${this.ipcStorage.id}]`);

        channel.send(
            'change',
            {
                ...toJS( change, {recurseEverything: true} ),
                item: item.id,
                ...(('newValue' in change) ? { newValue: (change.newValue == null ? null : SetupBase.getPlainValue(change.newValue)) } : undefined),
                ...(('oldValue' in change) ? { oldValue: (change.oldValue == null ? null : SetupBase.getPlainValue(change.oldValue)) } : undefined)
            } as IpcChangeArgsType,
            true
        );
    }

}



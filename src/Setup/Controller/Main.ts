import { BrowserWindow, ipcMain as electronIpcMain, IpcMainEvent, WebContents } from 'electron';
import { JSONSchema7 } from 'json-schema';
import { IArrayChange, IArraySplice, IMapDidChange, isObservableArray, isObservableProp, reaction, IReactionDisposer, Lambda } from 'mobx';
import { callerAndfName } from '../../utils/debugging';
import { Plugin } from '../Application/Plugin';
import { ObservableSetupBaseMap } from '../Container';
import { resolve } from '../JsonSchemaTools';
import { SetupBase } from '../SetupBase';
import { create } from '../SetupFactory';
import { SetupItemId } from '../SetupInterface';
import { UpdateChannel } from './UpdateChannel';
import { ControllerImpl, LocalChangeArgsType, SetupPromise } from './Controller';
import { IpcAddSchemaArgs, IpcChangeArgsType, IpcInitArgs, IpcMain, IpcRegisterArgs, IpcWindow } from './IpcInterface';


interface Renderer {
    // senderId: number;
    channel: UpdateChannel;
    subscriptions: Subscription[];
    disposers: Map<SetupItemId, Lambda[]>;
    updates: {};
}

interface Subscription {
    itemId: SetupItemId;
    depth: number;
}

export class Main extends ControllerImpl {
    protected getAllWindows = BrowserWindow.getAllWindows;
    protected getWindowById = BrowserWindow.fromId;

    private ipc: IpcMain = electronIpcMain;

    private ipcStorage: IpcWindow | undefined;

    private promises = new Array<SetupPromise>();

    constructor() {
        super();

        this.ipc.once('init', this.onInit);

        this.ipc.on('change', (...args) => this.onSetupChanged(...args));
        this.ipc.on('register', this.onRegister);

        this.ipc.on('addSchema', this.onAddSchema);
    }

    private renderers = new Array<Renderer | undefined>();

    async onSetupChanged(e: Event, update: IpcChangeArgsType, persist?: boolean): Promise<void> {
        const mainEvent = e as IpcMainEvent;
        const renderer = this.renderers[mainEvent.sender.id];

        if (!renderer)
            throw new Error(`${callerAndfName()}(${mainEvent.sender.id} doesn't exist in renderer ${Array.from(this.renderers.keys())})`);

        // console.log(`${callerAndfName()}[${mainEvent.sender.id}]${getIpcArgsLog(update)}`);

        renderer.channel.addReceived(update);

        super.onSetupChanged(e, update, persist);
    }

    private onAddSchema = (e: IpcMainEvent, args: IpcAddSchemaArgs): void => {
        // console.log(`${callerAndfName()}(${e.sender.id}, ${args.schema.$id})`);

        Plugin.add(args.schema);

        const sendSchema = (listener, id): void => {
            if ((listener != undefined) && (id != e.sender.id)) {
                console.log(`${callerAndfName()}(${e.sender.id}, ${args.schema.$id}) send to ${id}`);
                listener.channel.ipc.send('addSchema', { schema: args.schema });
            }
        };

        this.renderers.forEach(sendSchema);
    }


    private onRegister = (e: IpcMainEvent, args: IpcRegisterArgs): void => {
        this.register(e.sender, args);
    }

    private unRegister = (channelId: number): void => {
        console.log(`${callerAndfName()}[${channelId}]`);

        const renderer = this.renderers[channelId];

        if (!renderer) throw new Error(`${callerAndfName()} can't find [${channelId}] `);

        renderer.disposers.forEach(item =>
            item.forEach(disposer => disposer())
        );

        this.renderers[channelId] = undefined;
    }

    private register = (target: WebContents, { itemId, depth }: IpcRegisterArgs): void => {
        const { id } = target;

        let renderer = this.renderers[id];

        // if (this.configs.size == 0) {
        //     // console.log(`${callerAndfName()}[${this.changeListeners.length}]` +
        //     //     `(senderId=${senderId}, ${itemId}, d=${depth}) ignore - Hopefully own init for full config`);
        //     return;
        // }


        if (renderer == undefined) {
            console.log(`${callerAndfName()}[${this.renderers.length}](senderId=${id}, ${itemId}, d=${depth}) create renderer`);

            this.renderers[id] = renderer = {
                channel: new UpdateChannel(target),
                disposers: new Map<SetupItemId, IReactionDisposer[]>(),
                subscriptions: new Array<Subscription>(),
                updates: {}
            };
            target.once('destroyed', () => this.unRegister(id));

        } else {
            // console.log(`${callerAndfName()}[${this.changeListeners.length}]` +
            //     `(senderId=${senderId}, ${itemId}, d=${depth}) updateChannel exists`);
        }

        const subscription: Subscription = {
            itemId,
            depth
        };
        renderer.subscriptions.push(subscription);
        this.connectChangeListenerToExisting(subscription, renderer);
    }

    connectChangeListenerToExisting(subscription: Subscription, renderer: Renderer, item?: SetupBase, depth?: number): void {

        if (this.configs.size == 0) {
            console.log(`${callerAndfName()}[${renderer.channel.ipc.id},${subscription.itemId},${subscription.depth}]: no config yet`);
            return;
        }

        item = item ?? this.configs.get(subscription.itemId);
        depth = depth ?? 0;

        if (!item)
            throw new Error(`${callerAndfName()}([${renderer.channel.ipc.id},${subscription.itemId},${subscription.depth}] @ ${depth}`);

        this.connectChangeListener(item, renderer);

        for (const value of Object.values(item)) {
            if (((subscription.depth == -1) || (depth < subscription.depth)) && (value instanceof ObservableSetupBaseMap)) {
                // console.log(
                //     `${callerAndfName()}[${renderer.channel.ipc.id},${subscription.itemId},${subscription.depth}]:` +
                //     ` observe ${item.id}.${propertyName} as ObservableSetupBaseMap`);

                for (const child of value.values()) {
                    if (child)
                        this.connectChangeListenerToExisting(subscription, renderer, child, depth + 1);
                }

            } else if (value instanceof SetupBase) {
                // console.log(
                //     `[${this.constructor.name}].connectChangeListenerToExisting[${renderer.channel.ipc.id}` + 
                //     `,${subscription.itemId},${subscription.depth}]: observe ${item.id}.${propertyName}`);
                this.connectChangeListenerToExisting(subscription, renderer, value, depth);
            } else {
                // console.log(
                //     `${callerAndfName()}[${renderer.channel.ipc.id},${subscription.itemId},${subscription.depth}]: ignore ${propertyName}.${item.id}`);
            }
        }
    }

    private connectChangeListener(item: SetupBase, renderer: Renderer): void {
        // console.log(`${callerAndfName()}[${renderer.channel.ipc.id},${subscription.itemId},${subscription.depth}] ${item.id} @${listener.depth - offset}`);

        let disposers = renderer.disposers.get(item.id);

        if (!disposers) {
            disposers = new Array<Lambda>();
            renderer.disposers.set(item.id, disposers);

            for (const [propertyName, value] of Object.entries(item)) {
                if (value instanceof ObservableSetupBaseMap) {
                    // console.log(
                    //     `${callerAndfName()}[${renderer.channel.ipc.id},${subscription.itemId},${subscription.depth}]:` +
                    //     ` observe ${item.id}.${propertyName} as ObservableSetupBaseMap`);
                    disposers.push(
                        (value as ObservableSetupBaseMap<SetupBase>)
                            .observe((changes: IMapDidChange<string, SetupBase | null>) => {
                                if ((changes.type == 'update') && (changes.oldValue == null) && (changes.newValue != null)) {
                                    console.log(
                                        `[${this.constructor.name}].connectChangeListener[${renderer.channel.ipc.id}]` +
                                        ` (${item.id}.${propertyName}.${changes.name}) ignore overwriting null`);
                                    return;
                                }
                                // console.debug(
                                //     `[${this.constructor.name}].connectChangeListener[${renderer.channel.ipc.id},${subscription.itemId},${subscription.depth}]` +
                                //     ` ${item.id}.${propertyName}.${changes.name}, ${changes.type})`);
                                this.onChangeItemChanged(
                                    renderer,
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
                    // console.log(`[${this.constructor.name}].connectChangeListener[${renderer.channel.ipc.id}]: observe ${item.id}.${propertyName}`);

                    disposers.push(
                        value.observe(
                            (change: IArrayChange | IArraySplice) => {
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                const { object, ...rest } = change;

                                this.onChangeItemChanged(
                                    renderer,
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
                    // console.log(`[${this.constructor.name}].connectChangeListener[${renderer.channel.ipc.id}]: observe ${item.id}.${propertyName}`);

                    disposers.push(
                        reaction(
                            () => item[propertyName],
                            newValue => this.onChangeItemChanged(renderer, { item, name: propertyName, type: 'update', newValue, oldValue: item[propertyName] }),
                            {
                                name: `ChangeListener[${renderer.channel.ipc.id}, ${item.id}.${propertyName}]`
                            }
                        )
                    );
                } else {
                    // console.log(`${callerAndfName()}[${renderer.channel.ipc.id}]: ignore ${propertyName}.${item.id}`);
                }
            }
        }
    }

    private onChangeItemChanged = (renderer: Renderer, change: LocalChangeArgsType): void => {
        const { item, type } = change;

        if (!(item.id != undefined && item.className != undefined && item.parentId != undefined))
            throw new Error(
                `${callerAndfName()}(${name}, ${type} ): Invalid object: ${JSON.stringify(item)}`);

        renderer.channel.send('change', ControllerImpl.local2Ipc(change));
    }


    private connectChangeListeners(item: SetupBase): void {
        // console.log(`${callerAndfName()}[${this.changeListeners.length}](${item.id},${fireImmediately})`);
        for (const renderer of this.renderers) {
            if (renderer) {
                for (const subscription of renderer.subscriptions) {
                    /// Check if ancestor in within depth is listening
                    for (
                        let offset = 0, ancestor: SetupBase | undefined = item;
                        ((subscription.depth == -1) || (offset <= subscription.depth)) && (ancestor);
                        offset += 1, ancestor = ancestor.parentId == ancestor.id ? undefined : this.configs.get(ancestor.parentId)
                    ) {
                        if (subscription.itemId == ancestor.id) {
                            this.connectChangeListener(item, renderer);
                            break;
                        }
                    }
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

        const channel = this.renderers[this.ipcStorage.id]?.channel;

        if (channel == undefined)
            throw new Error(`${callerAndfName()}${ControllerImpl.getLocalArgsLog(change)}: no channel for ${this.ipcStorage.id}`);

        // console.log(`${callerAndfName()}${ControllerImpl.getLocalArgsLog(change)} -> [${this.ipcStorage.id}]`);

        channel.send(
            'change',
            ControllerImpl.local2Ipc(change),
            true
        );
    }

}



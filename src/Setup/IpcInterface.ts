import electron, { IpcRendererEvent, IpcMainEvent } from 'electron';
import { SetupItemId, SetupBaseInterface, PropertyKey, PropertyType as InterfacePropertyType } from './SetupInterface';
import { JSONSchema7 } from 'json-schema';

export type ChangeChannel = 'change';
export type RegisterChannel = 'register';
export type InitChannel = 'init';
export type AddSchemaChannel = 'addSchema';



interface IpcChangeArgs {
    item: SetupItemId;
    type: string;
}

interface IpcItemChangeArgs extends IpcChangeArgs {
    name: PropertyKey;
}

export interface IpcAddArgs extends IpcItemChangeArgs {
    type: 'add';
    newValue: InterfacePropertyType;
}

export interface IpcUpdateArgs extends IpcItemChangeArgs {
    type: 'update';
    newValue: InterfacePropertyType;
    oldValue: InterfacePropertyType;
}

export interface IpcRemoveArgs extends IpcItemChangeArgs {
    type: 'remove';
}

interface IpcMapChangeArgs extends IpcChangeArgs {
    map: PropertyKey;
    name: PropertyKey;
}

export interface IpcMapAddArgs extends IpcMapChangeArgs {
    type: 'add';
    newValue: SetupBaseInterface | null;
}

export interface IpcMapUpdateArgs extends IpcMapChangeArgs {
    type: 'update';
    newValue: SetupBaseInterface | null;
}

export interface IpcMapDeleteArgs extends IpcMapChangeArgs {
    type: 'delete';
}

interface IpcArrayChangeArgs extends IpcChangeArgs {
    array: PropertyKey;
    index: number;
}

export interface IpcArrayUpdateArgs extends IpcArrayChangeArgs {
    type: 'update';
    newValue: InterfacePropertyType;
}

export interface IpcArraySpliceArgs extends IpcArrayChangeArgs {
    type: 'splice';
    added: InterfacePropertyType[];
    removedCount: number;
}


export interface IpcInitArgs {
    schema: JSONSchema7;
    root: SetupBaseInterface;
}

export interface IpcAddSchemaArgs {
    schema: JSONSchema7;
}


export type IpcItemChangeArgsType = IpcAddArgs | IpcUpdateArgs | IpcRemoveArgs;
export type IpcMapChangeArgsType = IpcMapAddArgs | IpcMapUpdateArgs | IpcMapDeleteArgs;
export type IpcArrayChangeArgsType = IpcArrayUpdateArgs | IpcArraySpliceArgs;
export type IpcChangeArgsType = IpcItemChangeArgsType | IpcMapChangeArgsType | IpcArrayChangeArgsType;

// export type IpcChangeArgsType = IpcAddArgs | IpcUpdateArgs | IpcRemoveArgs | IpcMapAddArgs | IpcMapUpdateArgs | IpcMapDeleteArgs;


export interface IpcRenderer extends electron.IpcRenderer {
    send(channel: InitChannel, init: IpcInitArgs): void;
    send(channel: AddSchemaChannel, schema: IpcAddSchemaArgs): void;

    send(channel: ChangeChannel, update: IpcChangeArgsType): void;

    send(channel: RegisterChannel, args: IpcRegisterArgs): void;

    /// From IpcWindow.send
    on(channel: ChangeChannel, listener: (event: IpcRendererEvent, update: IpcChangeArgsType, persist?: boolean) => void): this;
    on(channel: AddSchemaChannel, listener: (event: IpcRendererEvent, update: IpcAddSchemaArgs) => void): this;

}

export interface IpcMain extends electron.IpcMain {
    once(channel: InitChannel, listener: (event: IpcMainEvent, init: IpcInitArgs) => void): this;

    on(channel: AddSchemaChannel, listener: (event: IpcMainEvent, update: IpcAddSchemaArgs) => void): this;

    on(channel: ChangeChannel, listener: (event: IpcMainEvent, update: IpcChangeArgsType, persist?: boolean) => void): this;

    on(channel: RegisterChannel, listener: (event: IpcMainEvent, args: IpcRegisterArgs) => void): this;
}

export interface IpcWindow extends electron.WebContents {
    send(channel: ChangeChannel, update: IpcChangeArgsType, persist: boolean): void;
    send(channel: AddSchemaChannel, schema: IpcAddSchemaArgs): void;
}

export interface IpcRegisterArgs {
    itemId: SetupItemId;
    depth: number;
}

export const getIpcArgsLog = (update: IpcChangeArgsType): string => {
    const { item, type } = update;
    const itemUpdate = (update as IpcItemChangeArgsType).name ? (update as IpcItemChangeArgsType) : undefined;
    const mapUpdate = (update as IpcMapChangeArgsType).map ? (update as IpcMapChangeArgsType) : undefined;
    const arrayUpdate = (update as IpcArrayChangeArgsType).array ? (update as IpcArrayChangeArgsType) : undefined;
    const spliceUpdate = (update as IpcArraySpliceArgs).added !== undefined && (update as IpcArraySpliceArgs).removedCount !== undefined ?
        (update as IpcArraySpliceArgs) : undefined;
    const name = itemUpdate?.name;
    const map = mapUpdate?.map;
    const array = arrayUpdate?.array;
    const newValue = update['newValue'];

    return (
        `(${item}.${map ?? array ?? ''}${mapUpdate ? '.' + mapUpdate.name : arrayUpdate ? '[' + arrayUpdate.index + ']' : name} ,${type})` +
        `${newValue ? '=' + newValue : spliceUpdate ? '-' + spliceUpdate.removedCount + '+' + spliceUpdate.added.length.toFixed() + spliceUpdate.added : ''}`
    );
};

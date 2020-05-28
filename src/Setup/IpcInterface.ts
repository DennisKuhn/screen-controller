import electron, { IpcRendererEvent, IpcMainEvent } from 'electron';
import { SetupItemId, SetupBaseInterface, PropertyKey, PropertyType as InterfacePropertyType } from './SetupInterface';
import { JSONSchema7 } from 'json-schema';

export type ChangeChannel = 'change';
export type RegisterChannel = 'register';
export type InitChannel = 'init';
export type AddSchemaChannel = 'addSchema';



export interface IpcChangeArgs {
    item: SetupItemId;
    name: PropertyKey;
    type: string;
}

export interface IpcAddArgs extends IpcChangeArgs {
    type: 'add';
    newValue: InterfacePropertyType;
}

export interface IpcUpdateArgs extends IpcChangeArgs {
    type: 'update';
    newValue: InterfacePropertyType;
}

export interface IpcRemoveArgs extends IpcChangeArgs {
    type: 'remove';
}

export interface IpcMapChangeArgs extends IpcChangeArgs {
    map: PropertyKey;
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

export interface IpcInitArgs {
    schema: JSONSchema7;
    root: SetupBaseInterface;
}

export interface IpcAddSchemaArgs {
    schema: JSONSchema7;
}


export type IpcChangeArgsType = IpcAddArgs | IpcUpdateArgs | IpcRemoveArgs | IpcMapAddArgs | IpcMapUpdateArgs | IpcMapDeleteArgs;
export type IpcItemChangeArgsType = IpcAddArgs | IpcUpdateArgs | IpcRemoveArgs;


export interface IpcRenderer extends electron.IpcRenderer {
    send(channel: InitChannel, init: IpcInitArgs): void;
    send(channel: AddSchemaChannel, schema: IpcAddSchemaArgs): void;

    send(channel: ChangeChannel, update: IpcChangeArgsType): void;

    send(channel: RegisterChannel, args: IpcRegisterArgs): void;

    /// From IpcWindow.send
    on(channel: ChangeChannel, listener: (event: IpcRendererEvent, update: IpcChangeArgsType, persist?: boolean) => void): this;

}

export interface IpcMain extends electron.IpcMain {
    once(channel: InitChannel, listener: (event: IpcMainEvent, init: IpcInitArgs) => void): this;

    on(channel: AddSchemaChannel, listener: (event: IpcMainEvent, update: IpcAddSchemaArgs) => void): this;

    on(channel: ChangeChannel, listener: (event: IpcMainEvent, update: IpcChangeArgsType, persist?: boolean) => void): this;

    on(channel: RegisterChannel, listener: (event: IpcMainEvent, args: IpcRegisterArgs) => void): this;
}

export interface IpcWindow extends electron.WebContents {
    send(channel: ChangeChannel, update: IpcChangeArgsType, persist: boolean): void;
}

export interface IpcRegisterArgs {
    itemId: SetupItemId;
    depth: number;
}

